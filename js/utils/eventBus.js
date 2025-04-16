/**
 * 简单事件总线，用于模块间通信
 * 允许组件通过发布-订阅模式进行松散耦合的通信
 */
const gEventBus = {
    _events: {},
    
    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} - 取消订阅的函数
     */
    subscribe(event, callback) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(callback);
        
        // 返回取消订阅的函数
        return () => this.unsubscribe(event, callback);
    },
    
    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 要传递的数据
     */
    publish(event, data) {
        if (!this._events[event]) return;
        this._events[event].forEach(callback => callback(data));
    },
    
    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 要取消的回调函数
     */
    unsubscribe(event, callback) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter(cb => cb !== callback);
    }
};

export default gEventBus; 