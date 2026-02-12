using FileManagerProject.Extensions;
using FileManagerProject.Middleware;
using FileManagerProject.Services;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Добавляем Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FileManager API", Version = "v1" });
});

// Настраиваем политику CORS (Cross-Origin Resource Sharing)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()  // Разрешаем запросы с любого источника
              .AllowAnyMethod()  // Разрешаем любые HTTP методы (GET, POST и т.д.)
              .AllowAnyHeader(); // Разрешаем любые заголовки
    });
});

builder.Services.AddSingleton<IFileSystemService, FileSystemService>();

var app = builder.Build();

// Включаем Swagger UI в режиме разработки
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "File Manager API V1");
        c.RoutePrefix = "swagger"; // Доступно по URL /swagger
    });
}

// Включаем CORS для всех запросов
app.UseCors("AllowAll");

app.UseMiddleware<ExceptionHandlingMiddleware>();

var api = app.MapGroup("/api/filemanager");
api.MinimalAPI();

app.Run();