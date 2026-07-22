using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal static class GameLauncher
{
    private const string ProjectRoot = @"C:\workspace\game";
    private const string GameUrl = "http://127.0.0.1:32177";

    [STAThread]
    private static void Main()
    {
        try
        {
            if (!Directory.Exists(ProjectRoot))
            {
                throw new DirectoryNotFoundException("게임 폴더를 찾을 수 없습니다: " + ProjectRoot);
            }

            if (!IsGameReady())
            {
                StartGameServer();
                WaitForGameServer();
            }

            OpenGameWindow();
        }
        catch (Exception exception)
        {
            TryWriteErrorLog(exception);
            MessageBox.Show(
                "게임을 실행하지 못했습니다.\n\n" + exception.Message +
                "\n\n오류 기록: C:\\workspace\\game\\게임_실행_오류.txt",
                "한국학 인사팀의 이상한 모험",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }

    private static bool IsGameReady()
    {
        try
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(GameUrl);
            request.Timeout = 1200;
            request.ReadWriteTimeout = 1200;
            request.Proxy = null;
            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
            {
                string html = reader.ReadToEnd();
                return response.StatusCode == HttpStatusCode.OK &&
                    html.IndexOf("한국학 인사팀의 이상한 모험", StringComparison.Ordinal) >= 0;
            }
        }
        catch
        {
            return false;
        }
    }

    private static void StartGameServer()
    {
        string npmPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            @"nodejs\npm.cmd"
        );

        if (!File.Exists(npmPath))
        {
            npmPath = "npm.cmd";
        }

        ProcessStartInfo server = new ProcessStartInfo();
        server.FileName = npmPath;
        server.Arguments = "run dev -- --port 32177 --hostname 127.0.0.1";
        server.WorkingDirectory = ProjectRoot;
        server.UseShellExecute = true;
        server.WindowStyle = ProcessWindowStyle.Hidden;
        Process.Start(server);
    }

    private static void WaitForGameServer()
    {
        for (int attempt = 0; attempt < 80; attempt++)
        {
            Thread.Sleep(250);
            if (IsGameReady())
            {
                return;
            }
        }

        throw new TimeoutException("게임 서버가 20초 안에 준비되지 않았습니다.");
    }

    private static void OpenGameWindow()
    {
        string edgePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
            @"Microsoft\Edge\Application\msedge.exe"
        );

        if (!File.Exists(edgePath))
        {
            Process.Start(GameUrl);
            return;
        }

        string profilePath = Path.Combine(ProjectRoot, ".game-window-profile");
        Directory.CreateDirectory(profilePath);

        ProcessStartInfo browser = new ProcessStartInfo();
        browser.FileName = edgePath;
        browser.Arguments =
            "--user-data-dir=\"" + profilePath + "\" " +
            "--no-first-run --disable-features=msEdgeSidebarV2 " +
            "--start-maximized --app=\"" + GameUrl + "\"";
        browser.WorkingDirectory = ProjectRoot;
        browser.UseShellExecute = true;
        Process.Start(browser);
    }

    private static void TryWriteErrorLog(Exception exception)
    {
        try
        {
            File.WriteAllText(
                Path.Combine(ProjectRoot, "게임_실행_오류.txt"),
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + Environment.NewLine + exception,
                Encoding.UTF8
            );
        }
        catch
        {
        }
    }
}
