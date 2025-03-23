# echo '进行常规检查'
# grep -rn 'type: Date' -B 3 ../models |grep '{'  |awk '$2!~/.*(At|Time|Date|birthdate|TS)/{print $0}'
# f1=`grep -rn 'type: Array' ../models | grep -v grep  |wc -l`
# if [ $f1 > 0 ];then
#     echo ' models type is Array num :' $f1
# fi
# grep -rE   --exclude-dir=node_modules  '../(validations|middleware|models|exports|state|routes|services|exports)/[A-Z]+'  ../*  

# echo "done...."