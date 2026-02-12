export class Panel {
    constructor(config) {
        this.currentPath = '';
        this.selected = new Set();
        this.active = false;
        this.handleDriveChange = (e) => {
            const select = e.target;
            const drive = select.value;
            if (drive)
                this.loadItems(drive).catch(err => {
                    console.error(`${this.name}: ошибка загрузки диска ${drive}`, err);
                });
        };
        this.handleParentClick = () => {
            const parent = this.getParentPath(this.currentPath);
            if (parent)
                this.loadItems(parent).catch(err => {
                    console.error(`${this.name}: ошибка перехода в родительскую папку`, err);
                });
        };
        this.handleContentClick = (e) => {
            const item = e.target.closest('.file-item');
            if (item) {
                const path = item.getAttribute('data-path');
                if (path)
                    this.toggleSelection(path);
            }
            else {
                this.clearSelection();
            }
            this.setActive(true);
        };
        this.handleDoubleClick = (e) => {
            const item = e.target.closest('.file-item');
            if (!item)
                return;
            const isDir = item.getAttribute('data-is-directory') === 'true';
            const path = item.getAttribute('data-path');
            if (isDir && path)
                this.loadItems(path).catch(err => {
                    console.error(`${this.name}: ошибка открытия папки ${path}`, err);
                });
        };
        const el = document.getElementById(config.elementId);
        if (!el)
            throw new Error(`Панель с id "${config.elementId}" не найдена`);
        this.element = el;
        this.service = config.service;
        this.name = config.name;
        this.onActivate = config.onActivate;
        this.content = this.element.querySelector('.panel-content');
        this.pathInput = this.element.querySelector('.path-input');
        this.driveSelect = this.element.querySelector('.drive-select');
        this.parentBtn = this.element.querySelector('.parent-btn');
        if (!this.content || !this.pathInput || !this.driveSelect || !this.parentBtn) {
            throw new Error('Отсутствуют обязательные элементы панели');
        }
        this.init();
    }
    init() {
        this.driveSelect.addEventListener('change', this.handleDriveChange);
        this.parentBtn.addEventListener('click', this.handleParentClick);
        this.content.addEventListener('click', this.handleContentClick);
        this.content.addEventListener('dblclick', this.handleDoubleClick);
    }
    async loadDrives() {
        try {
            const drives = await this.service.getDrives();
            this.driveSelect.innerHTML = '';
            drives.forEach(drive => {
                const opt = document.createElement('option');
                opt.value = drive;
                opt.textContent = drive;
                this.driveSelect.appendChild(opt);
            });
            if (drives.length)
                await this.loadItems(drives[0]);
        }
        catch (err) {
            console.error(`${this.name}: не удалось загрузить список дисков`, err);
            this.renderError('Не удалось загрузить диски');
        }
    }
    async loadItems(path) {
        try {
            this.currentPath = path;
            this.pathInput.value = path;
            this.clearSelection();
            this.renderLoading();
            const items = await this.service.getItems(path);
            this.renderItems(items);
        }
        catch (err) {
            console.error(`${this.name}: ошибка загрузки ${path}`, err);
            this.renderError('Не удалось загрузить файлы');
        }
    }
    renderItems(items) {
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
    getIcon(item) {
        if (item.isDirectory)
            return '📁';
        const ext = item.extension.toLowerCase();
        if (['jpg', 'png', 'gif', 'jpeg'].includes(ext))
            return '🖼️';
        if (['mp4', 'avi'].includes(ext))
            return '🎬';
        if (['mp3'].includes(ext))
            return '🎵';
        if (['zip', 'rar'].includes(ext))
            return '📦';
        if (['pdf'].includes(ext))
            return '📕';
        return '📄';
    }
    toggleSelection(path) {
        if (this.selected.has(path)) {
            this.selected.delete(path);
        }
        else {
            this.selected.add(path);
        }
        this.updateSelectionUI();
    }
    clearSelection() {
        this.selected.clear();
        this.updateSelectionUI();
    }
    updateSelectionUI() {
        this.content.querySelectorAll('.file-item').forEach(el => {
            const path = el.getAttribute('data-path');
            if (path && this.selected.has(path)) {
                el.classList.add('selected');
            }
            else {
                el.classList.remove('selected');
            }
        });
    }
    getParentPath(path) {
        const idx = path.replace(/\\/g, '/').lastIndexOf('/', path.length - 2);
        return idx === -1 ? null : path.slice(0, idx + 1);
    }
    renderLoading() {
        this.content.innerHTML = '<div class="loading">Загрузка...</div>';
    }
    renderError(msg) {
        this.content.innerHTML = `<div class="error">${this.escapeHTML(msg)}</div>`;
    }
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    setActive(active) {
        if (this.active === active)
            return;
        this.active = active;
        this.element.classList.toggle('panel-active', active);
        if (active)
            this.onActivate?.();
    }
    isActive() {
        return this.active;
    }
    getSelected() {
        return Array.from(this.selected);
    }
    getSelectedItems() {
        return this.getSelected();
    }
    getPath() {
        return this.currentPath;
    }
    getActivePath() {
        return this.getPath();
    }
    destroy() {
        this.driveSelect.removeEventListener('change', this.handleDriveChange);
        this.parentBtn.removeEventListener('click', this.handleParentClick);
        this.content.removeEventListener('click', this.handleContentClick);
        this.content.removeEventListener('dblclick', this.handleDoubleClick);
    }
}
