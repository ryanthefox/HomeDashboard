using HomeDashboard.Api.Models;
#if WINDOWS
using System.Runtime.InteropServices;
using NAudio.CoreAudioApi;
#endif

namespace HomeDashboard.Api.Services;

public class AudioService
{
    public List<AudioOutputDevice> GetOutputDevices()
    {
#if WINDOWS
        try
        {
            using var enumerator   = new MMDeviceEnumerator();
            var defaultDevice      = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
            return enumerator
                .EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active)
                .Select(d => new AudioOutputDevice(d.ID, d.FriendlyName, d.ID == defaultDevice.ID))
                .OrderBy(d => d.Name)
                .ToList();
        }
        catch { return []; }
#else
        return [];
#endif
    }

    public void SetDefaultDevice(string deviceId)
    {
#if WINDOWS
        var clsid  = new Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9");
        var type   = Type.GetTypeFromCLSID(clsid) ?? throw new InvalidOperationException("PolicyConfigClient not found");
        var config = (IPolicyConfig)Activator.CreateInstance(type)!;
        config.SetDefaultEndpoint(deviceId, ERole.eConsole);
        config.SetDefaultEndpoint(deviceId, ERole.eMultimedia);
        config.SetDefaultEndpoint(deviceId, ERole.eCommunications);
#endif
    }
}

#if WINDOWS
// ── COM interop (Windows only) ─────────────────────────────────────────────────
[System.Runtime.InteropServices.ComImport]
[Guid("F8679F50-850A-41CF-9C72-430F290290C8")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPolicyConfig
{
    void stub0(); void stub1(); void stub2(); void stub3(); void stub4();
    void stub5(); void stub6(); void stub7(); void stub8(); void stub9();

    [PreserveSig]
    int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string deviceId, ERole role);
}

internal enum ERole { eConsole = 0, eMultimedia = 1, eCommunications = 2 }
#endif
