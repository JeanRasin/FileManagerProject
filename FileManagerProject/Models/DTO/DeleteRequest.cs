namespace FileManagerProject.Models.DTO;

/// <summary>
/// Запрос на удаление файла/папки
/// </summary>
/// <param name="Path">Путь к файлу или папке</param>
public record DeleteRequest(string Path);