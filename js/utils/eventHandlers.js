/**
 * 事件处理工具模块
 * 统一管理键盘快捷键等事件
 */
import gEventBus from './eventBus.js';

class EventHandlers {
    /**
     * 创建事件处理工具实例
     */
    constructor() {
        this._keyboardHandler = this._handleKeyboardNavigation.bind(this);
        this._listeners = [];
    }

    /**
     * 初始化事件监听
     */
    init() {
        // 添加键盘事件监听
        document.addEventListener('keydown', this._keyboardHandler);
        this._listeners.push({
            target: document,
            type: 'keydown',
            handler: this._keyboardHandler
        });
    }

    /**
     * 清理所有事件监听
     */
    cleanup() {
        this._listeners.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        this._listeners = [];
    }

    /**
     * 处理键盘导航
     * @private
     * @param {KeyboardEvent} event - 键盘事件
     */
    _handleKeyboardNavigation(event) {
        // 如果当前焦点在输入框中，不处理键盘快捷键
        if (
            event.target.tagName === 'INPUT' ||
            event.target.tagName === 'TEXTAREA' ||
            event.target.isContentEditable
        ) {
            // 在页码输入框中按回车键时，触发页码变更事件
            if (event.key === 'Enter' && event.target.id === 'current-page') {
                gEventBus.publish('page-number-input-changed', {
                    value: parseInt(event.target.value, 10)
                });
                event.preventDefault();
            }
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
                // 左方向键：上一页
                gEventBus.publish('navigation-prev-page');
                event.preventDefault();
                break;
                
            case 'ArrowRight':
                // 右方向键：下一页
                gEventBus.publish('navigation-next-page');
                event.preventDefault();
                break;
                
            case 'Home':
                // Home键：第一页
                gEventBus.publish('navigation-first-page');
                event.preventDefault();
                break;
                
            case 'End':
                // End键：最后一页
                gEventBus.publish('navigation-last-page');
                event.preventDefault();
                break;
                
            case '+':
            case '=':
                // + 或 = 键：放大
                gEventBus.publish('zoom-in');
                event.preventDefault();
                break;
                
            case '-':
                // - 键：缩小
                gEventBus.publish('zoom-out');
                event.preventDefault();
                break;
                
            case 'f':
            case 'F':
                // 按F搜索（类似浏览器的Ctrl+F）
                if (event.ctrlKey) {
                    document.getElementById('search-input').focus();
                    event.preventDefault();
                }
                break;
                
            case 'F3':
                // F3：查找下一个
                if (event.shiftKey) {
                    gEventBus.publish('search-prev-match');
                } else {
                    gEventBus.publish('search-next-match');
                }
                event.preventDefault();
                break;
                
            case '0':
                // Ctrl+0：重置缩放
                if (event.ctrlKey) {
                    gEventBus.publish('zoom-reset');
                    event.preventDefault();
                }
                break;
                
            case '1':
                // Ctrl+1：单页视图
                if (event.ctrlKey) {
                    gEventBus.publish('view-mode-single');
                    event.preventDefault();
                }
                break;
                
            case '2':
                // Ctrl+2：双页视图
                if (event.ctrlKey) {
                    gEventBus.publish('view-mode-double');
                    event.preventDefault();
                }
                break;
        }
    }
}

// 创建单例
const gEventHandlers = new EventHandlers();
export default gEventHandlers; 