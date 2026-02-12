using FileManagerProject.Services;

namespace FileManagerProject.Middleware;

/// <summary>
/// Middleware для глобальной обработки исключений
/// </summary>
/// <param name="next">Следующий компонент в цепочке обработки запросов</param>
public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    /// <summary>
    /// Метод, который вызывается для каждого запроса
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Передаем запрос следующему компоненту в цепочке
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    /// <summary>
    /// Формирует ответ с ошибкой
    /// </summary>
    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Устанавливаем тип содержимого ответа
        context.Response.ContentType = "application/json";

        // Определяем HTTP статус код в зависимости от типа исключения
        var statusCode = exception switch
        {
            FileInUseException => 423, // Locked - файл заблокирован
            UnauthorizedAccessException => 403, // Forbidden - нет доступа
            FileNotFoundException or DirectoryNotFoundException => 404, // Not Found
            _ => 500 // Internal Server Error - любая другая ошибка
        };

        // Формируем объект ответа
        var response = new
        {
            statusCode,
            message = exception.Message,
            type = exception.GetType().Name
        };

        context.Response.StatusCode = statusCode;

        return context.Response.WriteAsJsonAsync(response);
    }
}

/// <summary>
/// Extension метод для удобного подключения middleware
/// </summary>
public static class ExceptionHandlingMiddlewareExtensions
{
    /// <summary>
    /// Подключает обработку исключений в конвейер приложения
    /// </summary>
    public static IApplicationBuilder UseExceptionHandling(
        this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}