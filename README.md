mysql 数据库表机构对比工具
=====

#centos7 安装nodejs
```
rpm -Uvh https://rpm.nodesource.com/pub_5.x/el/7/x86_64/nodesource-release-el7-1.noarch.rpm
yum install nodejs -y
```

#获取代码安装
```
git clone https://github.com/LiveXY/mysqldiff.git
cd mysqldiff/
npm install && npm link
```

#实例
```
#base
mysqldiff --db1=dbuser:dbpassword@dbhost~database --db2=dbuser:dbpassword@dbhost~database
#port
mysqldiff --db1=dbuser:dbpassword@dbhost~database#dbport --db2=dbuser:dbpassword@dbhost~database#dbport
#ssh
mysqldiff --db1=dbuser:dbpassword@dbhost~database --db2=dbuser:dbpassword@dbhost~database:dbport+sshuser:sshpassword@sshhost#sshport
```

#运行环境
支持linux、mac，ssh不支持windows
