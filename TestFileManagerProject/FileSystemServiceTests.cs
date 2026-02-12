using System.IO;
using FileManagerProject.Services;
using Xunit;

namespace FileManagerProject.Tests;

public class FileSystemServiceTests : IDisposable
{
    private readonly IFileSystemService _service;
    private readonly string _tempRoot;
    private readonly string _sourceDir;
    private readonly string _destDir;

    public FileSystemServiceTests()
    {
        _service = new FileSystemService();
        _tempRoot = Path.Combine(Path.GetTempPath(), $"FileServiceTests_{Guid.NewGuid():N}");
        _sourceDir = Path.Combine(_tempRoot, "source");
        _destDir = Path.Combine(_tempRoot, "dest");

        // Инициализация в конструкторе (синхронная)
        Directory.CreateDirectory(_sourceDir);
        Directory.CreateDirectory(_destDir);

        File.WriteAllText(Path.Combine(_sourceDir, "test.txt"), "content");
        File.WriteAllText(Path.Combine(_sourceDir, "image.png"), "binary");

        var nested = Path.Combine(_sourceDir, "subfolder");
        Directory.CreateDirectory(nested);
        File.WriteAllText(Path.Combine(nested, "nested.txt"), "nested");
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_tempRoot))
                Directory.Delete(_tempRoot, true);
        }
        catch
        {
            // Игнорируем ошибки очистки в тестах (файлы могут быть заблокированы)
        }
    }

    [Fact]
    public void GetDrives_ReturnsNonEmptyList()
    {
        var drives = _service.GetDrives();
        Assert.NotEmpty(drives);
    }

    [Fact]
    public void GetItems_ReturnsFilesAndFoldersWithCorrectMetadata()
    {
        var items = _service.GetItems(_sourceDir);

        Assert.Equal(3, items.Count); // 2 файла + 1 папка

        var folder = items.Single(i => i.IsDirectory);
        Assert.Equal(0, folder.Size);

        var txtFile = items.Single(i => i.Extension == "txt");
        Assert.False(txtFile.IsDirectory);
        Assert.Equal("content", File.ReadAllText(txtFile.Path));
    }

    [Fact]
    public void Copy_File_CopiesContentCorrectly()
    {
        var source = Path.Combine(_sourceDir, "test.txt");
        var dest = Path.Combine(_destDir, "copied.txt");

        _service.Copy(source, dest);

        Assert.True(File.Exists(dest));
        Assert.Equal("content", File.ReadAllText(dest));
    }

    [Fact]
    public void Copy_Directory_CopiesRecursively()
    {
        var dest = Path.Combine(_destDir, "copied_folder");

        static long GetDirSize(string path) => Directory
            .GetFiles(path, "*", SearchOption.AllDirectories)
            .Sum(f => new FileInfo(f).Length);

        var sourceSize = GetDirSize(_sourceDir);

        _service.Copy(_sourceDir, dest);

        Assert.True(Directory.Exists(dest));
        Assert.Equal(sourceSize, GetDirSize(dest));
    }

    [Fact]
    public void Move_File_MovesAndRemovesSource()
    {
        var source = Path.Combine(_sourceDir, "test.txt");
        var dest = Path.Combine(_destDir, "moved.txt");

        _service.Move(source, dest);

        Assert.True(File.Exists(dest));
        Assert.False(File.Exists(source));
    }

    [Fact]
    public void Delete_File_RemovesFile()
    {
        var file = Path.Combine(_sourceDir, "image.png");

        _service.Delete(file);

        Assert.False(File.Exists(file));
    }

    [Fact]
    public void Delete_Directory_RemovesRecursively()
    {
        _service.Delete(_sourceDir);

        Assert.False(Directory.Exists(_sourceDir));
    }

    [Fact]
    public void Copy_LockedFile_ThrowsFileInUseException()
    {
        var file = Path.Combine(_sourceDir, "locked.txt");
        File.WriteAllText(file, "locked");

        using var _ = File.Open(file, FileMode.Open, FileAccess.Read, FileShare.None);

        var dest = Path.Combine(_destDir, "locked_copy.txt");
        Assert.Throws<FileInUseException>(() => _service.Copy(file, dest));
    }
}