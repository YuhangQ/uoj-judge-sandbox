# uoj-judge-sandbox

一个使用 `TypeScript` 编写的，兼容原有 UOJ 项目的全新评测机。
评测沙盒使用 t123yh 开发的 [simple-sandbox](https://github.com/t123yh/simple-sandbox)

本项目入选 [2021暑期开源软件供应链点亮计划](https://summer.iscas.ac.cn/#/org/orgdetail/universaloj/proid210270781)

## 构建完整的 UOJ 镜像

这是本项目推荐使用的一种方式，可以随时根据最新版 UOJ 发行的 docker 镜像，对该镜像进行自动修改，生成一个采用本评测机的全新镜像。

### 使用方法

使用方法非常简单。

#### 安装 docker

略，推荐宿主机使用 Debian 或 Ubuntu 系统。

#### 拉取 UOJ 官方镜像

```bash
docker pull universaloj/uoj-system
```

#### 下载本项目

```bash
git clone https://github.com/YuhangQ/uoj-judge-sandbox
```

#### 使用 dockerfile 构建镜像

这一步最好处于国际网络环境，否则可能会遇到网络问题。

```bash
docker build -t uoj-with-sandbox .
```

#### 启用容器

注意这一步需要 `--privileged` 权限，否则评测机无法工作。

```bash
docker run --name uoj -dit -p 80:80 --privileged uoj-with-sandbox
```

现在你就可以使用搭配本项目使用的 UOJ 了。

### 已经在使用 UOJ 想升级评测机

请参考 `install/dockfile` 里面的命令，将这些命令手动用于原 UOJ 所在环境，就可以实现替换评测机。

## 评测机支持情况

| 语言   | 编译器                     | 支持情况 |
| ------ | -------------------------- | -------- |
| C      | gcc 9.3.0                  | 支持     |
| C++    | gcc 9.3.0                  | 支持     |
| C++11  | gcc 9.3.0                  | 支持     |
| Java8  | openjdk-8                  | 支持     |
| Java11 | openjdk-11                 | 支持     |
| Pascal | Free Pascal Compiler 3.0.4 | 支持     |

已实现功能列表：

- 传统题
- 提交答案题
- 交互题
- ACM题
- 子任务题
- 比赛
- hack
- 自定义 chk 判题
- 自定义 val 校验器

未实现功能列表：

- 自定义 judger（推荐修改源代码自行实现）
