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