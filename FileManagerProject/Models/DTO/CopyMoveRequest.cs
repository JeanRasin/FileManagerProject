namespace FileManagerProject.Models.DTO;

/// <summary>
/// Запрос на копирование или перемещение файла/папки
/// </summary>
/// <param name="SourcePath">Исходный путь</param>
/// <param name="DestinationPath">Целевой путь</param>
public record CopyMoveRequest(string SourcePath, string DestinationPath);