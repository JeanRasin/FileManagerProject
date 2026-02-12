using FileManagerProject.Models.DTO;
using FileManagerProject.Services;
using Microsoft.AspNetCore.Mvc;

namespace FileManagerProject.Extensions;

public static class MinimalAPIExtension
{
    public static void MinimalAPI(this RouteGroupBuilder builder)
    {
        // GET: Получение списка дисков
        builder.MapGet("/drives",  (IFileSystemService service) =>
        {
            var drives = service.GetDrives();

            return Results.Ok(drives);
        })
            .WithName("GetDrives");

        // GET: Получение списка файлов и папок
        builder.MapGet("/items",  ([FromQuery] string path, IFileSystemService service) =>
        {
            if (string.IsNullOrWhiteSpace(path))
                return Results.BadRequest("Путь не может быть пустым");

            if (!Path.IsPathRooted(path) || path.Contains(".."))
                return Results.BadRequest("Недопустимый путь");

            var items = service.GetItems(path);
            return Results.Ok(items);
        })
            .WithName("GetItems");

        // POST: Копирование файла/папки
        builder.MapPost("/copy",  ([FromBody] CopyMoveRequest request, IFileSystemService service) =>
        {
            if (string.IsNullOrWhiteSpace(request.SourcePath) || string.IsNullOrWhiteSpace(request.DestinationPath))
                return Results.BadRequest("Исходный и целевой пути обязательны");

            service.Copy(request.SourcePath, request.DestinationPath);
            return Results.Ok();
        })
            .WithName("CopyItem");

        // POST: Перемещение файла/папки
        builder.MapPost("/move",  ([FromBody] CopyMoveRequest request, IFileSystemService service) =>
        {
            if (string.IsNullOrWhiteSpace(request.SourcePath) || string.IsNullOrWhiteSpace(request.DestinationPath))
                return Results.BadRequest("Исходный и целевой пути обязательны");

            service.Move(request.SourcePath, request.DestinationPath);
            return Results.Ok();
        })
            .WithName("MoveItem");

        // POST: Удаление файла/папки
        builder.MapPost("/delete",  ([FromBody] DeleteRequest request, IFileSystemService service) =>
        {
            if (string.IsNullOrWhiteSpace(request.Path))
                return Results.BadRequest("Путь обязателен");

            service.Delete(request.Path);
            return Results.Ok();
        })
            .WithName("DeleteItem");
    }
}
