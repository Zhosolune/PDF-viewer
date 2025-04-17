/**
 * 应用程序入口
 * 负责初始化和组织各模块
 */
import gEventBus from './utils/eventBus.js';
import gAppState from './utils/appState.js';
import gUI from './utils/ui.js';
import gEventHandlers from './utils/eventHandlers.js';
import gPDFManager from './core/pdfManager.js';
import gPageRenderer from './core/pageRenderer.js';
import gViewModes from './core/viewModes.js';
import gNavigation from './features/navigation.js';
import gZoom from './features/zoom.js';
import gSearch from './features/search.js';
import gFileLoader from './features/fileLoader.js';
import gResponsiveLayout from './features/responsiveLayout.js';

/**
 * 初始化应用程序
 */
function initApp() {
    console.log('初始化PDF查看器应用');
    
    try {
        // 初始化PDF.js库
        const pdfInitialized = gPDFManager.init();
        if (!pdfInitialized) {
            console.error('PDF.js初始化失败');
            return;
        }
        
        // 初始化键盘事件处理
        gEventHandlers.init();
        
        // 显示欢迎消息
        gUI.showMessage('PDF查看器已准备就绪', 'success');
        
        // 发布应用初始化完成事件
        gEventBus.publish('app-initialized');
    } catch (error) {
        console.error('应用初始化错误:', error);
        gUI.showMessage('应用初始化错误: ' + error.message, 'error');
    }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 提供给外部使用的API
window.PDFViewer = {
    loadPDF: async (arrayBuffer, filename) => {
        return await gPDFManager.loadPdfFromArrayBuffer(arrayBuffer, filename);
    },
    closePDF: async () => {
        return await gPDFManager.closePdf();
    },
    goToPage: (pageNum) => {
        gNavigation.goToPage({ value: pageNum });
    },
    setZoom: (scale) => {
        gZoom.setZoom(scale);
    },
    search: (query) => {
        gSearch.searchText(query);
    },
    adjustLayout: () => {
        gResponsiveLayout._adjustLayout();
    }
}; 