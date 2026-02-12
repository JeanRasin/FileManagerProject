using FileManagerProject.Models;

namespace FileManagerProject.Services;

/// <summary>
/// Интерфейс сервиса для работы с файловой системой
/// </summary>
public interface IFileSystemService
{
    /// <summary>
    /// Получает список доступных дисков в системе
    /// </summary>
    /// <returns>Список путей к дискам (например: ["C:\\", "D:\\"])</returns>
    List<string> GetDrives();

    /// <summary>
    /// Получает список файлов и папок в указанной директории
    /// </summary>
    /// <param name="path">Путь к директории</param>
    /// <returns>Список элементов файловой системы</returns>
    List<FileItem> GetItems(string path);

    /// <summary>
    /// Копирует файл или папку из одного места в другое
    /// </summary>
    /// <param name="sourcePath">Исходный путь</param>
    /// <param name="destinationPath">Целевой путь</param>
    void Copy(string sourcePath, string destinationPath);

    /// <summary>
    /// Перемещает файл или папку из одного места в другое
    /// </summary>
    /// <param name="sourcePath">Исходный путь</param>
    /// <param name="destinationPath">Целевой путь</param>
    void Move(string sourcePath, string destinationPath);

    /// <summary>
    /// Удаляет файл или папку
    /// </summary>
    /// <param name="path">Путь к файлу или папке</param>
    void Delete(string path);
}