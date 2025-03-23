
const AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;
const storage = new AsyncLocalStorage();

const run = (cb) => {
    return new Promise((r, j)=>{
        storage.run({}, ()=>{
            cb().then(res=>r(res)).catch(err=>j(err));
        });
    });
}

const put = (key, value) => {
    let store = storage.getStore();
    store = store ? store : {};
    store[key] = value;
}
const get = (key) => {
    let store = storage.getStore();
    store = store ? store : {};
    return store[key];
}

module.exports = {
    storage,
    run,
    put,
    get,
}

