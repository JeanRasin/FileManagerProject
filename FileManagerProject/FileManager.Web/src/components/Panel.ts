import { FileItem } from '../models/FileItem';
import { FileManagerService } from '../services/FileManagerService'; 
interface IPanelConfig {
    elementId: string;
    name: string;
    service: FileManagerService;
    onActivate?: () => void;
}

export class Panel {
    private readonly element: HTMLElement;
    private readonly content: HTMLElement;
    private readonly pathInput: HTMLInputElement;
    private readonly driveSelect: HTMLSelectElement;
    private readonly parentBtn: HTMLButtonElement;

    private readonly service: FileManagerService;
    private readonly name: string;
    private readonly onActivate?: () => void;

    private currentPath = '';
    private selected = new Set<string>();
    private active = false;

    constructor(config: IPanelConfig) {
        const el = document.getElementById(config.elementId);
        if (!el) throw new Error(`Панель с id "${config.elementId}" не найдена`);

        this.element = el;
        this.service = config.service;
        this.name = config.name;
        this.onActivate = config.onActivate;

        this.content = this.element.querySelector('.panel-content') as HTMLElement;
        this.pathInput = this.element.querySelector('.path-input') as HTMLInputElement;
        this.driveSelect = this.element.querySelector('.drive-select') as HTMLSelectElement;
        this.parentBtn = this.element.querySelector('.parent-btn') as HTMLButtonElement;

        if (!this.content || !this.pathInput || !this.driveSelect || !this.parentBtn) {
            throw new Error('Отсутствуют обязательные элементы панели');
        }

        this.init();
    }

    private init(): void {
        this.driveSelect.addEventListener('change', this.handleDriveChange);
        this.parentBtn.addEventListener('click', this.handleParentClick);
        this.content.addEventListener('click', this.handleContentClick);
        this.content.addEventListener('dblclick', this.handleDoubleClick);
    }

    private handleDriveChange = (e: Event): void => {
        const select = e.target as HTMLSelectElement;
        const drive = select.value;
        if (drive) this.loadItems(drive).catch(err => {
            console.error(`${this.name}: ошибка загрузки диска ${drive}`, err);
        });
    };

    private handleParentClick = (): void => {
        const parent = this.getParentPath(this.currentPath);
        if (parent) this.loadItems(parent).catch(err => {
            console.error(`${this.name}: ошибка перехода в родительскую папку`, err);
        });
    };

    private handleContentClick = (e: MouseEvent): void => {
        const item = (e.target as HTMLElement).closest('.file-item');

        if (item) {
            const path = item.getAttribute('data-path');
            if (path) this.toggleSelection(path);
        } else {
            this.clearSelection();
        }

        this.setActive(true);
    };

    private handleDoubleClick = (e: MouseEvent): void => {
        const item = (e.target as HTMLElement).closest('.file-item');
        if (!item) return;

        const isDir = item.getAttribute('data-is-directory') === 'true';
        const path = item.getAttribute('data-path');

        if (isDir && path) this.loadItems(path).catch(err => {
            console.error(`${this.name}: ошибка открытия папки ${path}`, err);
        });
    };

    async loadDrives(): Promise<void> {
        try {
            const drives = await this.service.getDrives();

            this.driveSelect.innerHTML = '';

            drives.forEach(drive => {
                const opt = document.createElement('option');
                opt.value = drive;
                opt.textContent = drive;
                this.driveSelect.appendChild(opt);
            });

            if (drives.length) await this.loadItems(drives[0]);
        } catch (err) {
            console.error(`${this.name}: не удалось загрузить список дисков`, err);
            this.renderError('Не удалось загрузить диски');
        }
    }

    async loadItems(path: string): Promise<void> {
        try {
            this.currentPath = path;
            this.pathInput.value = path;
            this.clearSelection();

            this.renderLoading();
            const items = await this.service.getItems(path);
            this.renderItems(items);
        } catch (err) {
            console.error(`${this.name}: ошибка загрузки ${path}`, err);
            this.renderError('Не удалось загрузить файлы');
        }
    }

    private renderItems(items: FileItem[]): void {
        if (!items.length) {
            this.content.innerHTML = '<div class="empty">Папка пуста</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'file-item';
            el.setAttribute('data-path', item.path);
            el.setAttribute('data-is-directory', String(item.isDirectory));

            el.innerHTML = `
                <span class="file-icon">${this.getIcon(item)}</span>
                <div class="file-info">
                    <div class="file-name">${this.escapeHTML(item.name)}</div>
                    <div class="file-details">
                        ${item.isDirectory ? 'Папка' : this.service.formatSize(item.size)} 
                        | ${this.service.formatDate(item.lastModified)}
                    </div>
                </div>
            `;

            fragment.appendChild(el);
        });

        this.content.innerHTML = '';
        this.content.appendChild(fragment);
    }

    private getIcon(item: FileItem): string {
        if (item.isDirectory) return '📁';

        const ext = item.extension.toLowerCase();

        if (['jpg', 'png', 'gif', 'jpeg'].includes(ext)) return '🖼️';
        if (['mp4', 'avi'].includes(ext)) return '🎬';
        if (['mp3'].includes(ext)) return '🎵';
        if (['zip', 'rar'].includes(ext)) return '📦';
        if (['pdf'].includes(ext)) return '📕';

        return '📄';
    }

    private toggleSelection(path: string): void {
        if (this.selected.has(path)) {
            this.selected.delete(path);
        } else {
            this.selected.add(path);
        }

        this.updateSelectionUI();
    }

    private clearSelection(): void {
        this.selected.clear();
        this.updateSelectionUI();
    }

    private updateSelectionUI(): void {
        this.content.querySelectorAll('.file-item').forEach(el => {
            const path = el.getAttribute('data-path');
            if (path && this.selected.has(path)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }

    private getParentPath(path: string): string | null {
        const idx = path.replace(/\\/g, '/').lastIndexOf('/', path.length - 2);
        return idx === -1 ? null : path.slice(0, idx + 1);
    }

    private renderLoading(): void {
        this.content.innerHTML = '<div class="loading">Загрузка...</div>';
    }

    private renderError(msg: string): void {
        this.content.innerHTML = `<div class="error">${this.escapeHTML(msg)}</div>`;
    }

    private escapeHTML(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setActive(active: boolean): void {
        if (this.active === active) return;

        this.active = active;
        this.element.classList.toggle('panel-active', active);

        if (active) this.onActivate?.();
    }

    isActive(): boolean {
        return this.active;
    }

    getSelected(): string[] {
        return Array.from(this.selected);
    }

    getSelectedItems(): string[] {
        return this.getSelected();
    }

    getPath(): string {
        return this.currentPath;
    }

    getActivePath(): string {
        return this.getPath();
    }

    destroy(): void {
        this.driveSelect.removeEventListener('change', this.handleDriveChange);
        this.parentBtn.removeEventListener('click', this.handleParentClick);
        this.content.removeEventListener('click', this.handleContentClick);
        this.content.removeEventListener('dblclick', this.handleDoubleClick);
    }
}