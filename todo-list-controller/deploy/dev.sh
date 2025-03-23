# #推送到测试服上
# echo "1. check"
# . ops.sh
# echo "start push...."
# ip=root@47.108.159.51
# dir=/home/pacs/backend/pacs-backend
# scp ../.env_dev ${ip}:${dir}/pacs-controller/.env
# ssh ${ip} "cd ${dir}; git checkout develop-new; git pull; ps aux|grep 'npm start'|grep -v grep | awk '{print \$2}'  | xargs kill ; cd ./pacs-controller ;pwd; nohup npm start & "
# echo "done!"