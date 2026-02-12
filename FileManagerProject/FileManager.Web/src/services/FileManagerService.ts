import { FileItem } from '../models/FileItem';
export class FileManagerService {
    
    private readonly baseUrl = 'http://localhost:5165/api/filemanager';

    /**
     * Получает список доступных дисков
     * @returns Массив строк с путями дисков (например: ["C:\\", "D:\\"])
     */
    async getDrives(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/drives`);

            if (!response.ok) {
                throw await this.handleError(response);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения дисков:', error);
            throw error;
        }
    }

    /**
     * Получает список файлов и папок в указанной директории
     * @param path Путь к директории
     * @returns Массив элементов файловой системы
     */
    async getItems(path: string): Promise<FileItem[]> {
        try {
            const url = `${this.baseUrl}/items?path=${encodeURIComponent(path)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw await this.handleError(response);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения файлов:', error);
            throw error;
        }
    }

    /**
     * Копирует файл или папку
     * @param sourcePath Исходный путь
     * @param destinationPath Целевой путь
     */
    async copy(sourcePath: string, destinationPath: string): Promise<void> {
        await this.performFileOperation('/copy', { sourcePath, destinationPath });
    }

    /**
     * Перемещает файл или папку
     * @param sourcePath Исходный путь
     * @param destinationPath Целевой путь
     */
    async move(sourcePath: string, destinationPath: string): Promise<void> {
        await this.performFileOperation('/move', { sourcePath, destinationPath });
    }

    /**
     * Удаляет файл или папку
     * @param path Путь к файлу или папке
     */
    async delete(path: string): Promise<void> {
        await this.performFileOperation('/delete', { path });
    }

    /**
     * Вспомогательный метод для выполнения операций с файлами
     * @param endpoint Конечная точка API (/copy, /move, /delete)
     * @param body Тело запроса
     */
    private async performFileOperation(
        endpoint: string,
        body: any
    ): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw await this.handleError(response);
            }
        } catch (error) {
            console.error('Ошибка операции с файлом:', error);
            throw error;
        }
    }

    /**
     * Обрабатывает ошибки от сервера
     * @param response Ответ сервера
     * @returns Ошибка с понятным сообщением
     */
    private async handleError(response: Response): Promise<Error> {
        try {
            const errorData = await response.json();

            const message = this.getErrorMessage(response.status, errorData.message);
            return new Error(message);
        } catch {
            return new Error(`Ошибка сервера: ${response.status}`);
        }
    }

    /**
     * Возвращает понятное сообщение об ошибке по статус коду
     * @param statusCode HTTP статус код
     * @param serverMessage Сообщение от сервера
     * @returns Понятное сообщение для пользователя
     */
    private getErrorMessage(statusCode: number, serverMessage: string): string {
        const messages: { [key: number]: string } = {
            403: 'Нет доступа к файлу или директории',
            404: 'Файл или директория не найдены',
            423: `Файл заблокирован другим процессом: ${serverMessage}`,
            500: `Внутренняя ошибка сервера: ${serverMessage}`
        };

        return messages[statusCode] || serverMessage || 'Неизвестная ошибка';
    }

    /**
     * Форматирует размер файла в человекочитаемый вид
     * @param bytes Размер в байтах
     * @returns Строка с форматированным размером (например: "1.5 Мб")
     */
    formatSize(bytes: number): string {
        if (bytes === 0) return '0 б';

        const sizes = ['б', 'Кб', 'Мб', 'Гб', 'Тб'];

        // Вычисляем индекс нужной единицы измерения
        // Используем логарифм для определения порядка величины
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        // Вычисляем размер в нужных единицах с округлением
        const size = (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0);

        return `${size} ${sizes[i]}`;
    }

    /**
     * Форматирует дату в удобочитаемый формат
     * @param dateString Строка с датой в формате ISO
     * @returns Строка с датой в формате "ДД.ММ.ГГГГ ЧЧ:ММ:СС"
     */
    formatDate(dateString: string): string {
        const date = new Date(dateString);

        // Используем встроенный метод для форматирования даты
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',      // Полный год (2024)
            month: '2-digit',     // Месяц с ведущим нулём (01-12)
            day: '2-digit',       // День с ведущим нулём (01-31)
            hour: '2-digit',      // Часы с ведущим нулём (00-23)
            minute: '2-digit',    // Минуты с ведущим нулём (00-59)
            second: '2-digit'     // Секунды с ведущим нулём (00-59)
        });
    }
}