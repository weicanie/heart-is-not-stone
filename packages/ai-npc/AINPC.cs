using System.Diagnostics.CodeAnalysis;
using ModShardLauncher;
using ModShardLauncher.Mods;
using UndertaleModLib.Models;
using static UndertaleModLib.Models.UndertaleGameObject;

namespace AINPC;

[SuppressMessage("Interoperability", "CA1416:Validate platform compatibility")]
public class AINPC : Mod
{
  public override string Name => "heart-is-not-stone";
  public override string Author => "weicanie";
  public override string Description => "An AI npc mod made by weicanie(https://github.com/weicanie).";
  public override string Version => "1.3.0";

  public override void PatchMod()
  {
    Msl.InsertGMLString(ModFiles.GetCode("inputLogAsync.gml"), "gml_Object_o_player_KeyPress_116", 0);
    Msl.AddNewEvent("o_player", ModFiles.GetCode("asyncHttp.gml"), EventType.Other, 62);
    // Msl.AddNewEvent("o_player", ModFiles.GetCode("asyncHttp-no-data-change.gml"), EventType.Other, 62);
    Msl.InsertGMLString(ModFiles.GetCode("accout_set.gml"), "gml_Object_o_player_KeyPress_117", 0);
  }
}