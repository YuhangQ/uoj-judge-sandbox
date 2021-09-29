## 前言

笔者机器使用 `Windows10` 系统，所以在 UOJ 的二次开发上一定会遇到很多问题。

所以本文使用 `hyper-v` 安装 `Debian10` 在虚拟机上进行开发。

然后利用 `VSCode remote` 连接虚拟机进行编码。

UOJ 原版使用 docker 运行，这里开发为了方便，也在 docker 中进行开发。

两层虚拟化，笔者电脑配置为 `AMD 5600X + 32G`内存，目前来说没有遇到可以感受到的效率问题。

### 重要：有关网络问题

> 一定要使用透明代理或 VPN 处于完整的国际互联网连接中，否则每一步都有可能存在网络问题导致失败。

## 构建 Docker 镜像

首先 fork 一份 UOJ 的代码，并且 clone 到本地。

```bash
git clone -b develop https://github.com/YuhangQ/UOJ-System.git
```

这里使用 -b 指定开发版分支，然后进入构建的工作目录。

```bash
cd UOJ-System/install/bundle/
```

根据 [本地构建镜像 - UOJ部署指北 (universaloj.github.io)](https://universaloj.github.io/post/本地构建镜像.html)  的官方手册，开始构建镜像。

编辑当前目录的 `Dockerfile` 文件，发现有个 git clone

```dockerfile
RUN git clone https://github.com/UniversalOJ/UOJ-System.git --depth 1 --single-branch ${CLONE_ADDFLAG} uoj
```

我们希望它构建的是我们 fork 的版本，所以将其改为

```dockerfile
RUN git clone -b develop https://github.com/YuhangQ/UOJ-System.git --depth 1 --single-branch ${CLONE_ADDFLAG} uoj
```

接着编辑当前目录的 `Install` 文件，在

```bash
#Update apt sources and install
echo "deb http://ppa.launchpad.net/stesie/libv8/ubuntu bionic main" | tee /etc/apt/sources.list.d/stesie-libv8.list && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys D858A0DF
```

添加仓库源的后面增加如下内容。

```bash
apt-get install -y curl
for fingerprint in 1A10946ED858A0DF; do
	curl "http://keyserver.ubuntu.com/pks/lookup?op=get&fingerprint=on&search=0x$fingerprint" | \
	awk '/-----BEGIN PGP/{p=1} /-----END PGP/{print; p=0} p==1{print}' > key.txt;
	apt-key add key.txt;
done
```

这一步是为了防止，添加 public key 失败，导致后面出现问题。

> 这一步完成后，一定要 push !!!!!!!!!!!!!!!!!!
>
> 否则构建的时候从仓库拉代码后的 install.sh 是没有被更新过的！

运行下面的命令，开始构建 UOJ 镜像

```bash
sudo docker build -t uoj-system .
```

如果不是第一次构建，之前有缓存的话，使用 `--no-cache` 参数，可以重新构建。

```bash
sudo docker build --no-cache -t uoj-system .
```

构建完成则会显示如下信息，但一定要看下上面有没有什么重要的报错，即使构建出现错误也会构建成功。

```
Successfully tagged uoj-system:latest
```

接下来运行镜像试试，创建 docker 卷 uoj 并将其挂载到 /opt 目录，用于操作 docker 内部代码

```bash
sudo docker volume create uoj
sudo docker run --mount source=uoj,target=/opt --name uoj -dit -p 80:80 -p 3690:3690 -p 5678:5678 -p 6789:6789 --cap-add SYS_PTRACE uoj-system
```

