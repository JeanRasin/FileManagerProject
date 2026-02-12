namespace FileManagerProject.Models;

public record FileItem(
    string Name,
    string Path,
    long Size,
    DateTime LastModified,
    bool IsDirectory,
    string Extension
);