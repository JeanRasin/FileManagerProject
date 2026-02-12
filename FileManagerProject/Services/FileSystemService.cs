using System.IO;
using FileManagerProject.Models;

namespace FileManagerProject.Services;

public class FileSystemService : IFileSystemService
{
    public List<string> GetDrives()
    {
        return [.. DriveInfo.GetDrives()
            .Where(d => d.IsReady)
            .Select(d => d.Name)];
    }

    public List<FileItem> GetItems(string path)
    {
        if (!Directory.Exists(path))
            throw new DirectoryNotFoundException($"Каталог не найден: {path}");

        var directory = new DirectoryInfo(path);
        var result = new List<FileItem>(directory.GetDirectories().Length + directory.GetFiles().Length);

        foreach (var dir in directory.EnumerateDirectories())
        {
            result.Add(new FileItem(
                Name: dir.Name,
                Path: dir.FullName,
                Size: 0,
                LastModified: dir.LastWriteTime,
                IsDirectory: true,
                Extension: ""
            ));
        }

        foreach (var file in directory.EnumerateFiles())
        {
            result.Add(new FileItem(
                Name: file.Name,
                Path: file.FullName,
                Size: file.Length,
                LastModified: file.LastWriteTime,
                IsDirectory: false,
                Extension: file.Extension.TrimStart('.').ToLowerInvariant()
            ));
        }

        return result;
    }

    public void Copy(string sourcePath, string destinationPath)
    {
        if (Directory.Exists(sourcePath))
            CopyDirectory(sourcePath, destinationPath);
        else
            CopyFile(sourcePath, destinationPath);
    }

    private static void CopyFile(string source, string destination)
    {
        try
        {
            File.Copy(source, destination, true);
        }
        catch (IOException ex) when (IsFileLocked(ex))
        {
            throw new FileInUseException(source, ex);
        }
    }

    private static void CopyDirectory(string sourceDir, string destDir)
    {
        Directory.CreateDirectory(destDir);

        foreach (var file in Directory.EnumerateFiles(sourceDir))
        {
            var destFile = Path.Combine(destDir, Path.GetFileName(file));
            CopyFile(file, destFile);
        }

        foreach (var subdir in Directory.EnumerateDirectories(sourceDir))
        {
            var destSubdir = Path.Combine(destDir, Path.GetFileName(subdir));
            CopyDirectory(subdir, destSubdir);
        }
    }

    public void Move(string sourcePath, string destinationPath)
    {
        try
        {
            if (Directory.Exists(sourcePath))
                Directory.Move(sourcePath, destinationPath);
            else
                File.Move(sourcePath, destinationPath, true);
        }
        catch (IOException ex) when (IsFileLocked(ex))
        {
            throw new FileInUseException(sourcePath, ex);
        }
    }

    public void Delete(string path)
    {
        try
        {
            if (Directory.Exists(path))
                Directory.Delete(path, true);
            else
                File.Delete(path);
        }
        catch (IOException ex) when (IsFileLocked(ex))
        {
            throw new FileInUseException(path, ex);
        }
    }

    private static bool IsFileLocked(IOException ex)
    {
        var errorCode = (uint)ex.HResult & 0x0000FFFF;
        return errorCode is 32 or 33; // ERROR_SHARING_VIOLATION / ERROR_LOCK_VIOLATION
    }
}