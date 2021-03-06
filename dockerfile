FROM universaloj/uoj-system

RUN mkdir /opt/sandbox-test
WORKDIR /opt/sandbox-test

RUN wget https://github.com.cnpmjs.org/YuhangQ/uoj-judge-sandbox/releases/download/%E7%8E%AF%E5%A2%83/rootfs.tar.gz
RUN tar zxvf rootfs.tar.gz
RUN rm -rf ./rootfs.tar.gz


RUN apt update
RUN apt install -y nodejs-dev node-gyp libssl1.0-dev
RUN apt install -y npm
RUN npm cache clean -f
RUN npm install -g n
RUN n stable
RUN npm install -g yarn
RUN yarn global add typescript

RUN git clone https://github.com/t123yh/simple-sandbox
RUN apt install -y build-essential clang++-10 libfmt-dev
WORKDIR /opt/sandbox-test/simple-sandbox
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:jonathonf/gcc
RUN apt update
RUN apt-get install -y gcc-9 g++-9

RUN CXX='g++-9' yarn install
RUN yarn run build


WORKDIR /opt/uoj/judger
RUN mv judge_client judge_client_old

RUN git clone https://github.com/YuhangQ/uoj-judge-sandbox
WORKDIR /opt/uoj/judger/uoj-judge-sandbox
RUN yarn
RUN tsc
RUN mkdir tmp
RUN mkdir ./tmp/work
RUN mkdir ./tmp/data
WORKDIR /opt/uoj/judger/uoj-judge-sandbox/checkers
RUN make

RUN echo "\
#!/bin/sh\n\
chown -R mysql:mysql /var/lib/mysql /var/run/mysqld\n\
if [ ! -f \"/var/uoj_data/.UOJSetupDone\" ]; then\n\
  cd /opt/uoj/install/bundle && sh install.sh -i\n\
fi\n\
service ntp start\n\
service mysql start\n\
service apache2 start\n\
node /opt/uoj/judger/uoj-judge-sandbox/build/main.js > /opt/uoj/judger/judger.log \n\
exec bash\n" >/opt/up && chmod +x /opt/up