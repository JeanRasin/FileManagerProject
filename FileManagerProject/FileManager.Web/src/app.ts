import { Panel } from './components/Panel';
import { FileManagerService } from './services/FileManagerService';

interface IToast {
    element: HTMLDivElement;
    timeout: number;
}

export class FileManagerApp {
    private leftPanel: Panel;
    private rightPanel: Panel;
    private activePanelName: 'left' | 'right' = 'left';
    private fileService: FileManagerService;
    private activeToasts: IToast[] = [];

    constructor() {
        this.fileService = new FileManagerService();

        const createPanel = (name: 'left' | 'right') =>
            new Panel({
                elementId: `${name}Panel`,
                name,
                service: this.fileService,
                onActivate: () => this.setActivePanel(name)
            });

        this.leftPanel = createPanel('left');
        this.rightPanel = createPanel('right');
        this.leftPanel.setActive(true);

        this.setupActionButtons();
        this.initialize();
    }

    private setActivePanel(name: 'left' | 'right'): void {
        if (this.activePanelName === name) return;

        const target = name === 'left' ? this.leftPanel : this.rightPanel;
        const other = name === 'left' ? this.rightPanel : this.leftPanel;

        other.setActive(false);
        target.setActive(true);
        this.activePanelName = name;
    }

    private getSelectedItems(panel: Panel): string[] | null {
        const items = panel.getSelected();
        if (items.length === 0) {
            this.showToast('⚠️', 'Не выбрано ни одного файла или папки', 'warning');
            return null;
        }
        return items;
    }

    private getOperationPanels() {
        const source = this.activePanelName === 'left' ? this.leftPanel : this.rightPanel;
        const target = this.activePanelName === 'left' ? this.rightPanel : this.leftPanel;
        return { source, target };
    }

    private async performFileOperation(
        operation: 'copy' | 'move',
        items: string[],
        source: Panel,
        target: Panel
    ): Promise<void> {
        const action = operation === 'copy' ? 'копировании' : 'перемещении';
        const verb = operation === 'copy' ? 'Скопировано' : 'Перемещено';
        const method = operation === 'copy'
            ? this.fileService.copy.bind(this.fileService)
            : this.fileService.move.bind(this.fileService);

        const destPath = target.getPath();

        try {
            for (const item of items) {
                const fileName = this.getFileName(item);
                await method(item, `${destPath}/${fileName}`);
            }

            this.showToast('✅', `${verb} элементов: ${items.length}`, 'success');

            if (operation === 'move') {
                await source.loadItems(source.getPath());
            }
            await target.loadItems(destPath);
        } catch (error) {
            this.showError(`Ошибка при ${action}`, error);
        }
    }

    private async copyFiles(): Promise<void> {
        const { source, target } = this.getOperationPanels();
        const items = this.getSelectedItems(source);
        if (!items) return;
        await this.performFileOperation('copy', items, source, target);
    }

    private async moveFiles(): Promise<void> {
        const { source, target } = this.getOperationPanels();
        const items = this.getSelectedItems(source);
        if (!items) return;
        await this.performFileOperation('move', items, source, target);
    }

    private async deleteFiles(): Promise<void> {
        const panel = this.activePanelName === 'left' ? this.leftPanel : this.rightPanel;
        const items = this.getSelectedItems(panel);
        if (!items) return;

        const itemName = items.length === 1
            ? `"${this.getFileName(items[0])}"`
            : `${items.length} элементов`;

        if (!confirm(`Удалить ${itemName}?`)) return;

        try {
            for (const item of items) {
                await this.fileService.delete(item);
            }
            this.showToast('✅', `Удалено элементов: ${items.length}`, 'success');
            await panel.loadItems(panel.getPath());
        } catch (error) {
            this.showError('Ошибка при удалении', error);
        }
    }

    private getFileName(path: string): string {
        return path.replace(/\\/g, '/').split('/').pop() || '';
    }

    private showToast(icon: string, message: string, type: 'success' | 'warning' | 'error'): void {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
        document.body.appendChild(toast);

        const timeout = setTimeout(() => {
            toast.remove();
            this.activeToasts = this.activeToasts.filter(t => t.element !== toast);
        }, 3000);

        this.activeToasts.push({ element: toast, timeout });
    }

    private showError(context: string, error: unknown): void {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`${context}:`, msg);
        this.showToast('❌', `${context}: ${msg}`, 'error');
    }

    private setupActionButtons(): void {
        const buttons: Record<string, () => void> = {
            copyBtn: () => this.copyFiles(),
            moveBtn: () => this.moveFiles(),
            deleteBtn: () => this.deleteFiles()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            document.getElementById(id)?.addEventListener('click', handler);
        });
    }

    private async initialize(): Promise<void> {
        try {
            await Promise.all([
                this.leftPanel.loadDrives(),
                this.rightPanel.loadDrives()
            ]);
        } catch (error) {
            this.showError('Не удалось запустить файловый менеджер', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FileManagerApp();
});