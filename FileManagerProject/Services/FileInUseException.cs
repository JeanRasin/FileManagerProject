namespace FileManagerProject.Services;

/// <summary>
/// Исключение, которое выбрасывается когда файл заблокирован другим процессом.
/// </summary>
public class FileInUseException : Exception
{
    /// <summary>
    /// Создает новое исключение с указанием пути к заблокированному файлу
    /// </summary>
    /// <param name="path">Путь к заблокированному файлу</param>
    /// <param name="innerException">Исходное исключение, которое вызвало эту ошибку</param>
    public FileInUseException(string path, Exception innerException)
        : base($"Файл '{path}' используется другим процессом", innerException) => FilePath = path;

    /// <summary>
    /// Путь к заблокированному файлу
    /// </summary>
    public string FilePath { get; }
}