## 1.项目介绍

是一款仿微信私有化部署的聊天软件。包含群组创建，好友申请，单聊，群聊，支持发送文字，表情，图片，视频，文件，同时还支持离线缓存，在线预览。

## 1.问题准备

### Netty

需要@Async 异步启动。

1. 简要描述一下netty的工作原理?你怎么使用的netty?

#### Netty 的核心组件

1. `Channel`（通道）：Netty 网络通信的组件，能够用于执行网络 I/O 操作，如读、写、连接和绑定。Channel 提供了一种抽象，能够代表不同类型的网络连接，如套接字连接。

2. `EventLoop`（事件循环）：用于处理 I/O 操作的多线程事件循环。Netty 的 EventLoop 会处理所有的 I/O 事件，如接受新的连接、读数据、写数据等，它减少了线程上下文切换的开销，提高了性能。

3. `ChannelHandler（`通道处理器）：负责处理或拦截入站和出站操作，如读取数据、写入数据、连接或断开连接。

4. `ChannelPipeline`（通道流水线）：提供了一个 ChannelHandler 链的容器，用户可以定义一系列的 ChannelHandler 来处理或拦截入站和出站事件。项目里面主要的Handler就是-- 处理http协议、处理连接超时（heartbeat）、处理websocket协议。

5. ServerBootstrap：这两个辅助类用于设置服务器的启动参数，如绑定端口、设置线程模型等。通过设置bossgroup 和 workgroup 两个事件循环群，将建立连接与数据读写操作隔离开：

    * `bossGroup` 负责接收进来的连接。当一个连接请求到达时，`bossGroup` 会处理这个请求，完成TCP三次握手，并注册这个新的连接到它的一个`Channel`上。然后`bossGroup` 就会将这个连接（实际上是`Channel`）转发给`workGroup`处理后续的数据读写操作。

    * `workGroup` 负责处理所有I/O事件，包括数据的读写。在Netty中，一个`EventLoopGroup`包含多个`EventLoop`，每个`EventLoop`都绑定到一个或多个`Channel`上，并处理这些`Channel`的所有I/O操作。

#### Netty 的工作流程

1. 服务器启动：

    * 使用 `ServerBootstrap` 类来配置服务器启动参数，如设置 NIO 传输器、设置 EventLoopGroup（用于处理 I/O 操作）、设置 Channel 的类型（如 NIO 的 `NioServerSocketChannel`）、设置 ChannelPipeline 以及添加一系列的 ChannelHandler。

    * 绑定端口并启动服务器，等待客户端连接。

2. 客户端连接：

    * 客户端使用 `Bootstrap` 类配置连接参数，如设置 EventLoopGroup、设置 Channel 类型（如 NIO 的 `NioSocketChannel`）、设置 ChannelPipeline 以及添加 ChannelHandler。

    * 客户端发起连接请求，Netty 服务器接收到连接请求后，会创建一个新的 Channel 实例，并将其注册到 EventLoop 上。

3. 数据读写：

    * 当有数据到达时，Netty 将接收到的数据封装成一个事件，推送到ChannelPipeline中，再由channel里面的 Handler 依次处理这个事件。

    * 处理完业务逻辑后，如果需要回复数据给客户端，则可以通过 Channel 发送数据。发送的数据也会被封装成一个事件，并通过 ChannelPipeline 中的编码器编码成字节数据后发送出去。

4. 连接关闭：

    * 当客户端或服务器决定关闭连接时，会触发关闭事件，Netty 会将这个事件推送到 ChannelPipeline 中。

    * ChannelPipeline 中的 ChannelHandler 可以处理关闭事件，例如，可以执行一些清理工作，如释放资源。

5. 聊天具体是怎么实现的？

    1. 服务器总共有两个线程安全的`ConcurrentHashMap`。一个是用户user\_map，一个是用于群组通信的group\_map。

   ```java
   private static final ConcurrentHashMap<String, Channel> USER_CONTEXT_MAP = new ConcurrentHashMap<>();
   private static final ConcurrentHashMap<String, ChannelGroup> GROUP_CONTEXT_MAP = new ConcurrentHashMap<>();
   ```

    * 前面叙述的步骤完成后，假如现在有一个连接请求且完成了三次tcp握手和一次http握手，`userEventTriggered`被触发，根据请求参数`ChannelHandlerContext`拿到请求用户的userId。校验成功后分三步：

        1. 把用户channel，到user\_map里面

        2. 在redis里查出用户所有的联系人id列表，如果里面有群组，就把用户channel加到群组group\_map对应的`channelGroup`里面。

        3. 记录心跳、mysql更新最近连接时间等等。

    * 然后，查询会话信息，保证会话同步。查最近三天内的会话列表、好友申请列表和消息列表发ws消息过去。

    * 具体聊天部分：

        1. 首先不论是单聊，还是群聊都有一个唯一的会话id -- sessionId。单聊是两方面userId拼在一起md5加密，群聊sessionId是groupId的md5加密。

        2. 确定这个之后，发消息主要的几个参数contactId，消息类型、消息内容。用单聊举例子：contacId校验通过后， 去user\_map里面查找，（这中间有个集群部署的问题，两方不一定连在同一个服务器上，可以用redission做消息订阅转发，每一台服务器都收到请求去检索自己的user\_map有没有对面channel）

            1. 如果有他的通道说明对面在线，把一整个messageDto转换成json，新建ws数据帧，然后往对面的这个channel  `writeAndFlush`（这个方法结合了首先将数据`write`到内部缓冲区中，然后立即调用`flush`方法将缓冲区中的数据写出到网络套接字中`socket`。这样做的目的是减少API调用次数，同时确保数据能够尽快地被发送到网络上。）发送成功后更新Mysql数据库，会话表、消息表。

            2. 如果没有他的通道说明目前不在线，只往数据库里写数据，保存好，等他下次上线时会从数据库查给他最近三天的未读消息。

6. 上传文件这部分是怎么实现的？

文件部分分成上传文件和下载文件两部分：

* **上传文件：**

    * 文件对象用的是`MultipartFile`，在http协议中可以`multipart/form-data`编码类型实现，这种编码方式允许表单中包含文件。

    * 服务器收到文件后，一切顺利的话。文件名字重新设置成消息id -- messageId，因为这个是唯一的。保存路径根据时间来，每个月份一个文件夹。存下来，然后发ws消息给接收人，并且在mysql数据库里面记录消息。对面可以选择下载。

* **下载文件**

    * 下载功能用的是`httpResponse`给他把文件传回去，三个关键的就是

  ```java
  response.setContentType("application/x-msdownload; charset=UTF-8");
  response.setHeader("Content-Disposition", "attachment;");
  response.setContentLengthLong(file.length());
  ```

    * 然后：

        1. 创建`inputStream()`从文件读取数据

        2. 用一个固定大小的缓冲区临时存储，再循环的将数据读取到缓冲区并且输出到response的输出流的`OutputStream`中，

        3. 发送到文件末尾再`flush()`一下。（确保所有数据都能及时传送）

        4. 最后关闭输入输出流。

    * 客户端拿到文件之后就能查看了，存储位置能自由选择，具体文件夹也是月份分布。

- 机器人对接文心大模型具体讲讲？

* 其实就是调用了百度qianfan平台里的一款开源大模型，引入依赖后，把发的消息装配好去请求响应，返回的答案由机器人发给用户，在界面展示。我做的比较简单每次都是新开的会话，应该可以做的更好，比如多次对话绑定之类，或者是构建私有的知识图谱等等。。。

### websocket协议：

1. 讲一讲websocket协议？

* Websocket是一种实时双向通信协议，与HTTP相比主要有以下主要区别：

    * 连接方式：WebSocket 提供持久的连接，通过握手过程建立连接后保持打开状态，而HTTP是无状态的，每次请求都需要重新建立连接。

    * 数据格式：WebSocket 支持文本和二进制数据的传输，而 HTTP 主要是传输文本数据。

    * 数据传输方式：WebSocket 实现了全双工通信，客户端和服务器可以同时发送和接收数据，而 HTTP 是单向的，客户端发起请求，服务器响应数据。

* Websocket相对于HTTP有以下优势

    * 实时性：WebSocket提供了低延迟的实时双向通信能力，在服务器端有新数据时立即推送给客户端。服务器也能主动发消息给客户端。

    * 较低的网络开销：WebSocket 使用长连接，相对于频繁的短连接请求，减少了网络开销。提升一部分性能。

    * 跨域支持：WebSocket 具备跨域通信的能力，可以跨域进行实时通信。

* Websocket的连接是怎么建立的

    * 一般是先建立http连接，通过http连接升级成ws连接。

    * 客户端发送 WebSocket 握手请求（发的是http请求），请求头包含 Upgrade 和 Connection 字段，指定协议升级和建立连接。

    * 服务器收到握手请求后，验证请求头的字段，并返回握手响应，响应头包含 Upgrade 和 Connection 字段，以及一个随机的 Sec-WebSocket-Key 字段。

    * 客户端收到握手响应后，验证响应头的字段，并生成一个 Sec-WebSocket-Accept 值进行验证。

> 在websocket层面看仅需一次http请求与响应的握手，实质上还包含着tcp连接的三次握手
>
> &#x20;-》 先建立tcp连接，再发通过http协议握手，升级成websocket协议

### TCP协议的三次握手四次挥手

TCP（Transmission Control Protocol，传输控制协议）是互联网协议套件中的核心协议之一，位于传输层，提供面向连接的、可靠的字节流服务。

#### 一、TCP协议的三次握手

TCP的三次握手是建立TCP连接的过程，确保双方都能接收到数据包和发送数据包，并同步双方的序列号（seq）和确认号（ack），为后续的数据传输做好准备。

1. 第一次握手

* 发送内容：客户端发送一个带有SYN（synchronize，同步）标志的数据包给服务端，表示希望建立连接，并指明客户端的初始化序列号（seq）。

* 状态变化：客户端进入SYN\_SENT状态。

- 第二次握手

* 发送内容：服务端收到客户端的SYN包后，回传一个带有SYN/ACK（synchronize/acknowledge，同步/确认）标志的数据包给客户端，表示同意建立连接，并指明自己的初始化序列号（seq），同时将客户端的seq+1作为ACK的值，表示已接收到客户端的SYN包。

* 状态变化：服务端进入SYN\_RCVD状态。

- 第三次握手：

* 发送内容：客户端收到服务端的SYN/ACK包后，发送一个带有ACK标志的数据包给服务端，表示已接收到服务端的SYN/ACK包，并将服务端的seq+1作为自己的ACK值。

* 状态变化：客户端进入ESTABLISHED状态，表示连接已建立。服务端在收到这个ACK包后，也进入ESTABLISHED状态，此时双方可以进行数据传输。

#### 二、TCP协议的四次挥手

TCP的四次挥手是断开TCP连接的过程，目的是释放双方占用的网络资源，并优雅地结束通信。

1. 第一次挥手

* 发送内容：当一方（假设为客户端）完成数据发送后，会向对方（服务端）发送一个FIN（finish，结束）段，表示它将不再发送任何数据，但仍能接收数据。

* 状态变化：客户端进入FIN\_WAIT\_1状态。

- 第二次挥手

* 发送内容：服务端收到客户端的FIN段后，会回复一个ACK段给客户端，确认号为客户端的序列号加一，以表示接收到了客户端的终止请求。

* 状态变化：服务端进入CLOSE\_WAIT状态，表示它已经知道客户端希望断开连接，但此时服务端还可以继续发送数据。

- 第三次挥手

* 发送内容：当服务端也完成所有数据的发送后，会向客户端发送一个FIN段，表示服务端也将停止数据发送。

* 状态变化：服务端进入LAST\_ACK状态，等待客户端的确认。

- 第四次挥手

* 发送内容：客户端收到服务端的FIN段后，会回复一个ACK段给服务端，确认号为服务端的序列号加一，以表示接收到了服务端的终止请求。

* 状态变化：客户端进入TIME\_WAIT状态，等待足够的时间（通常是2MSL，即两倍的最大报文段生存时间）以确保服务端接收到它的连接终止请求的确认。之后，客户端进入CLOSED状态，表示连接已完全关闭。服务端在收到客户端的ACK段后，也进入CLOSED状态。

### 登录校验

1. 登陆具体怎么实现的？

每次注册、登录都需要填写实时生成的一个captcha验证码。

有一个库 ArithmeticCaptcha，每次新建一个对象，都会包含他的图片验证码的地址和正确结果。 正确结果绑定一个随机生成的uuid作为checkCodeKey存到redis里面，10min过期。把checkCodeKey和验证码图片的base64编码封装好返回给前端。然后在校验的时候不论是成功与否都要把这个redis记录删掉，就算没触发，设置的过期时间也是10分钟，没有用到的验证码也会被及时的删掉。另外就是密码肯定是不能明文存储，在从前端传过来的密码和数据库里面存储的都是md5加密过的字符串。

登陆成功之后，会在redis里面存储token、heartbeat和用户对象dto。

**token：**&#x7528;于登录校验，是由用户的userid加上一段随机字符串，再经过MD5加密得到的。下发到客户端后每次都在请求头中携带过来。防止没有登录的非法请求。

**heartbeat ：**&#x5FC3;跳朴素的理解就是ws始终在线的状态，用的是System.curMillls()记录的当前系统时间毫秒数存储在redis中，登陆成功建立ws连接时就会往redis里面记录下，后面每次channel上面有数据到来触发读操作时，重写的channelRead0函数会更新心跳。ws本身就有心跳机制保证链路是通的，隔60s会自动往通道发消息保证连接。退出时关闭通道，删除redis里面存储的心跳。

**dto：**&#x5C31;是一个对象，包含了一些有用的信息，比如token、是否是管理员等等。，后面会用到。

* MD5加密：[【面试总结】MD5及加密算法优劣\_md5码计算速度有哪些有关-CSDN博客](https://blog.csdn.net/weixin_38035852/article/details/81667160)

- 为什么用这种登录校验方式？而不是用常见的cookie、session和JWT？：

* cookie是在客户端存储了用户信息的小段数据，每次请求时往服务器发，但是比较容易被窃取和修改。而且跨域管理比较复杂，一般是不允许跨域携带cookie。

* session是在服务端存储用户信息，用户端只需要存一个sessionId在cookie，服务端通过这个来检索会话信息。也就是说需要服务器持续跟踪会话，假如后续分布式部署的话，需要额外的会话同步，增加复杂性。

* Jwt payload负载里有时候会携带很多信息吧，占用比较多的带宽，影响传输效率。

### 更新/灰度更新

首先，更新是超级管理员能发，可以上传新版本，也能随时修改上传的版本描述等等。

支持灰度更新，就是部分用户能收到更新，小范围内进行测试，保证稳定性。在发布前后能够修改灰度名单。用户在登陆的时候受限是触发版本校验，如果有支持更新的版本就会弹窗提示，没有的话就是正常进行。

### 超级管理员

超级管理员也就是相当于“灰度”吧，可以在配置文件里指定有多个管理员的id，不在的话就是普通用户，在的话就是会多一些功能，可以访问一些特殊的接口。这些接口被拦截器（aop）管理着，每次访问都会校验当前访问人的id是不是在管理员。具体同**登录校验具体实现**。
