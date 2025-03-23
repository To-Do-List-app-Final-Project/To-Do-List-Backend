// 判断是否为空返回默认值
const getValueDef = (data, def) => {
    return data == undefined || data == null ? def : data;
}

// 将字段转换映射为数组
const field2array = (field) => {
    if (!(field instanceof Array)) {
        //字段转换
        // 处理.分割
        field = field.split('.');
        let fds = [];
        field.forEach(x => {
            if (!x) {
                return;
            }
            // 处理[]数组
            let tfs = x.split('[');
            if (tfs.length <= 1) {
                fds.push(x);
            } else {
                tfs.forEach(y => {
                    if (!y) {
                        return;
                    }
                    fds.push(y.endsWith(']') ? +(y.substr(0, y.length - 1)) : y);
                });
            }
        });
        field = fds;
    }
    return field;
}

// 对象中提取字段，未找到可返回默认字段
const getFieldValue = (data, field, def) => {
    def = getValueDef(def, '');
    if (!data || !field) {
        return def;
    }
    let fields = field2array(field);

    let value = data;
    for (let idx in fields) {
        let fd = fields[idx];
        value = value[fd];
        if (value == undefined || value == null) {
            return def;
        }
    }
    return value;
}

const setFieldValue = (data, field, value) => {
    if (!data) {
        return;
    }
    let fields = field2array(field);

    let node = data;
    for (let i = 0; i < fields.length; i++) {
        let fd = fields[i];

        if (i + 1 == fields.length) {
            // 最后阶段
            node[fd] = value;
            return;
        }

        let nfd = fields[i + 1];
        // 中间变量
        if (typeof (node[fd]) === 'object') {
            if (typeof (nfd) === 'number') {
                if (!(node[fd] instanceof Array)) {
                    node[fd] = [];
                }
            } else {
                if (node[fd] instanceof Array) {
                    node[fd] = {};
                }
            }
        } else {
            node[fd] = typeof (nfd) === 'number' ? [] : {};
        }
        node = node[fd];
    }
}

const initFieldValue = (data, field, def) => {
    let val = getFieldValue(data, field, def);
    setFieldValue(data, field, val);
}

const data2field = (data) => {
    let fields = [];
    const isLeafNode = (node) => {
        if (node == null || node == undefined) {
            return true;
        }
        if (typeof (node) != 'object') {
            return true;
        }
        let count = 0;
        for (let key in node) {
            count++;
        }
        return count == 0;
    }
    const scanData = (data, fields, parentField) => {
        for (let key in data) {
            let node = data[key];
            let nfield = null;
            if (data instanceof Array) {
                nfield = parentField ? parentField + '[' + key + ']' : key;
            } else {
                nfield = parentField ? parentField + '.' + key : key;
            }
            if (isLeafNode(node)) {
                fields.push({ field: nfield, data: node });
            } else {
                scanData(node, fields, nfield);
            }
        }
    }
    scanData(data, fields, '');
    return fields;
}

const initField = (data, defData) => {
    if (!data || !defData) {
        return;
    }
    let fields = data2field(defData);
    for (let i in fields) {
        let field = fields[i];
        setFieldValue(data, field.field, field.data);
    }
}

module.exports = {
    getValueDef,
    getFieldValue,
    field2array,
    setFieldValue,
    initFieldValue,
    data2field,
    initField,
};
