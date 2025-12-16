var _content = get_string("请输入:", "");
if (_content != "")
{

    var _obj_ind = asset_get_index("o_dialogue");
    var _dialogue_inst = instance_find(_obj_ind, 0);
    if(!instance_exists(_dialogue_inst)) {
        scr_actionsLogUpdate("你在和空气交谈...");
        //return;
    }

    scr_actionsLogUpdate(_content);
    
    if (_content == "debug_npc")
    {
        if (variable_global_exists("caravanFollowersList"))
        {
            var _size = ds_list_size(global.caravanFollowersList);
            scr_actionsLogUpdate("Found " + string(_size) + " followers.");
            for (var i = 0; i < _size; i++)
            {
                var _followerMap = ds_list_find_value(global.caravanFollowersList, i);
                if (ds_map_exists(_followerMap, "npc_key"))
                {
                    var _key = ds_map_find_value(_followerMap, "npc_key");
                    scr_actionsLogUpdate("NPC Key: " + string(_key));
                }
            }
        }
        else
        {
            scr_actionsLogUpdate("Error: global.caravanFollowersList not found.");
        }
        return;
    }

    if(_content == "debug_msg") {

        var _obj_ind = asset_get_index("o_dialogue");
        var _dialogue_inst = instance_find(_obj_ind, 0);
        
        if(instance_exists(_dialogue_inst)) {
            with(_dialogue_inst) {
                scr_dialogue_set_text("替换后的npc消息");
                
                var _render_ind = asset_get_index("o_dialogRender");
                if (instance_exists(_render_ind)) {
                    with(instance_find(_render_ind, 0)) {
                        if (variable_instance_exists(other, "is_activate")) {
                            surfaceDraw = other.is_activate;
                        }
                        event_user(0); 
                    }
                }

                var _npc = speaker_instance;
                var _npc_name = "Unknown";
                if (instance_exists(_npc)) {
                    if (variable_instance_exists(_npc, "name")) {
                        _npc_name = _npc.name;
                    }
                    scr_actionsLogUpdate("检测到 NPC - ID: " + string(_npc) + ", 名称: " + string(_npc_name));
                } else {
                    scr_actionsLogUpdate("警告: 无法找到对应的 NPC 实例 (speaker_instance 无效)");
                }
            }
        }
            scr_actionsLogUpdate("调试: 已执行 scr_dialogue_set_text 并强制刷新");
        return;
    }

    if (_content == "debug_info") {
        var _obj_ind = asset_get_index("o_dialogue");
        var _dialogue_inst = instance_find(_obj_ind, 0);
        if (instance_exists(_dialogue_inst)) {
            with (_dialogue_inst) {
                var _npc = speaker_instance;
                if (instance_exists(_npc)) {
                    var _info = "NPC Info:\n";
                    _info += "ID: " + string(_npc) + "\n";
                    _info += "Object: " + object_get_name(_npc.object_index) + "\n";
                    
                    if (variable_instance_exists(_npc, "name")) _info += "Name: " + string(_npc.name) + "\n";
                    if (variable_instance_exists(_npc, "state")) _info += "State: " + string(_npc.state) + "\n";
                    if (variable_instance_exists(_npc, "is_neutral")) _info += "Is Neutral: " + string(_npc.is_neutral) + "\n";
                    if (variable_instance_exists(_npc, "faction")) _info += "Faction: " + string(_npc.faction) + "\n";
                    if (variable_instance_exists(_npc, "HP")) _info += "HP: " + string(_npc.HP) + "/" + string(_npc.max_hp) + "\n";
                    
                    scr_actionsLogUpdate(_info);
                } else {
                    scr_actionsLogUpdate("无有效 NPC 实例。");
                }
            }
        }
        return;
    }

    if (string_pos("set_hostile", _content) == 1) {
        var _args = string_split(_content, " ");
        if (array_length(_args) >= 2) {
            var _is_hostile = real(_args[1]); 
            
            var _obj_ind = asset_get_index("o_dialogue");
            var _dialogue_inst = instance_find(_obj_ind, 0);
            if (instance_exists(_dialogue_inst)) {
                with (_dialogue_inst) {
                    var _npc = speaker_instance;
                    if (instance_exists(_npc)) {
                        _npc.is_neutral = (_is_hostile == 0);
                        
                        if (_is_hostile) {
                            var _obj_ind = asset_get_index("o_dialogue");
                            var _dialogue_inst = instance_find(_obj_ind, 0);
                            if (instance_exists(_dialogue_inst)) {
                                with (_dialogue_inst) {
                                    instance_destroy();
                                }
                                scr_actionsLogUpdate("对话框已强制关闭");
                            }

                            _npc.state = "idle";
                            with(_npc) {
                                if (variable_instance_exists(id, "scr_update_FSM_NPC")) {
                                    script_execute(asset_get_index("scr_update_FSM_NPC"));
                                } else if (asset_get_index("scr_update_FSM_NPC") != -1) {
                                    script_execute(asset_get_index("scr_update_FSM_NPC"));
                                }
                                

                            }
                            _npc.state = "attack";
                             if (instance_exists(o_player)) {
                                _npc.target = o_player.id;
                             }
                            scr_actionsLogUpdate("NPC 设为敌对 (scr_stateMoveToPlayer)");
                        } else {
                            _npc.state = "idle";
                            _npc.target = -4; // null
                            scr_actionsLogUpdate("NPC 设为中立 (is_neutral=true, state=idle)");
                        }
                    }
                }
            }
        }
        return;
    }

    if (string_pos("add_rep", _content) == 1) {
        var _args = string_split(_content, " ");
        if (array_length(_args) >= 2) {
            var _val = real(_args[1]);
            
            if (variable_global_exists("playerGridX") && variable_global_exists("playerGridY")) {
                 var _gridX = global.playerGridX;
                 var _gridY = global.playerGridY;
                 
                 var _scr = asset_get_index("scr_globaltile_reputation_update");
                 if (_scr != -1) {
                     script_execute(_scr, _val, _gridX, _gridY);
                     scr_actionsLogUpdate("已修改区域声望: " + string(_val));
                 } else {
                     scr_actionsLogUpdate("错误: 找不到 scr_globaltile_reputation_update 脚本");
                 }
            } else {
                scr_actionsLogUpdate("错误: 无法获取玩家全局坐标 (global.playerGridX/Y)");
            }
        }
        return;
    }

    if (_content == "find_container") {
        var _found_count = 0;
        var _found_info = "";
        with (all) {
            if (variable_instance_exists(id, "itemsContainer")) {
                var _name = object_get_name(object_index);
                _found_info += _name + "(" + string(id) + ") ";
                _found_count++;
            }
        }
        if (_found_count > 0) {
            scr_actionsLogUpdate("发现 itemsContainer 所有者: " + _found_info);
        } else {
            scr_actionsLogUpdate("未发现任何对象拥有 itemsContainer 变量。");
        }
        return;
    }

    if (_content == "debug_player") {
        if (instance_exists(o_player)) {
            var _p = instance_find(o_player, 0);
            scr_actionsLogUpdate("Player ID: " + string(_p) + " Obj: " + object_get_name(_p.object_index));
            
            if (variable_instance_exists(_p, "itemsContainer")) {
                scr_actionsLogUpdate("itemsContainer: " + string(_p.itemsContainer));
            } else {
                scr_actionsLogUpdate("itemsContainer: MISSING");
                // 列出部分变量以供参考
                var _vars = variable_instance_get_names(_p);
                var _str = "部分变量: ";
                var _count = 0;
                for (var i = 0; i < array_length(_vars); i++) {
                    if (_count < 10) { // 只显示前10个
                        _str += _vars[i] + ", ";
                        _count++;
                    }
                    if (string_pos("ontainer", _vars[i]) > 0) {
                         scr_actionsLogUpdate("疑似容器变量: " + _vars[i]);
                    }
                }
                scr_actionsLogUpdate(_str);
            }
        } else {
            scr_actionsLogUpdate("错误: 找不到 o_player 实例");
        }
        return;
    }

    if (string_pos("add_item", _content) == 1) {
        var _args = string_split(_content, " ");
        if (array_length(_args) >= 2) {
            var _item_str = _args[1];
            var _amount = 1;
            if (array_length(_args) >= 3) _amount = real(_args[2]);
            
            var _item_obj = -1;
            if (string_length(string_digits(_item_str)) == string_length(_item_str)) {
                _item_obj = real(_item_str);
            } else {
                _item_obj = asset_get_index(_item_str);
            }
            
            if (_item_obj != -1) {
                var _scr_add = asset_get_index("scr_inventory_add_item");
                if (_scr_add != -1) {
                    var _inventory_obj = asset_get_index("o_inventory");
                    var _owner_inst = noone;
                    
                    if (_inventory_obj != -1 && instance_exists(_inventory_obj)) {
                         _owner_inst = instance_find(_inventory_obj, 0);
                    }
                    
                    if (_owner_inst != noone) {
                         if (!variable_instance_exists(_owner_inst, "itemsContainer")) {
                             scr_actionsLogUpdate("错误: o_inventory 实例缺少 itemsContainer 变量。");
                             return;
                         }

                        repeat(_amount) {
                            script_execute(_scr_add, _item_obj, _owner_inst);
                        }
                        scr_actionsLogUpdate("已尝试添加物品: " + string(_item_str) + " x" + string(_amount));
                    } else {
                        scr_actionsLogUpdate("错误: 找不到背包实例 (o_inventory)");
                    }
                } else {
                    scr_actionsLogUpdate("错误: 找不到 scr_inventory_add_item 脚本");
                }
            } else {
                scr_actionsLogUpdate("错误: 无效的物品名称或ID: " + _item_str);
            }
        }
        return;
    }

    if (string_pos("spawn_item", _content) == 1) {
        var _args = string_split(_content, " ");
        if (array_length(_args) >= 2) {
            var _item_str = _args[1];
            
            var _item_obj = -1;
            if (string_length(string_digits(_item_str)) == string_length(_item_str)) {
                _item_obj = real(_item_str);
            } else {
                _item_obj = asset_get_index(_item_str);
            }
            
            if (_item_obj != -1) {
                if (instance_exists(o_player)) {
                    instance_create_depth(o_player.x, o_player.y, 0, _item_obj);
                    scr_actionsLogUpdate("已在脚下生成: " + string(_item_str));
                } else {
                    scr_actionsLogUpdate("错误: 找不到玩家位置");
                }
            } else {
                scr_actionsLogUpdate("错误: 无效的物品名称或ID: " + _item_str);
            }
        }
        return;
    }

    var _obj_ind = asset_get_index("o_dialogue");
    var _dialogue_inst = instance_find(_obj_ind, 0);
    var _content_npc = "(你在等待回应...)";
    var _npc_name = "Unknown"; 
    if(instance_exists(_dialogue_inst)) {
        with(_dialogue_inst) {
            var _npc = speaker_instance;
            if (instance_exists(_npc)) {
                if (variable_instance_exists(_npc, "name")) {
                    _npc_name = _npc.name;
                }
            } else {
                scr_actionsLogUpdate("警告: 无法找到对应的 NPC 实例");
            }

            scr_dialogue_set_text(_content_npc);
            
            var _render_ind = asset_get_index("o_dialogRender");
            if (instance_exists(_render_ind)) {
                with(instance_find(_render_ind, 0)) {
                    if (variable_instance_exists(other, "is_activate")) {
                        surfaceDraw = other.is_activate;
                    }
                    event_user(0); 
                }
            }
        }
    }


    var _account_json_str = "";
    var _filename = "not_stone.json";
    
    if (file_exists(_filename)) {
        var _file = file_text_open_read(_filename);
        while (!file_text_eof(_file)) {
            _account_json_str += file_text_read_string(_file);
            file_text_readln(_file);
        }
        file_text_close(_file);
    }
    
    if (_account_json_str == "") {
        scr_actionsLogUpdate("错误: 未找到账户配置文件 (not_stone.json)，请按F6配置。");
        return;
    }

    var _account_map = json_decode(_account_json_str);
    if (_account_map == -1) {
        scr_actionsLogUpdate("错误: 账户配置文件解析失败，请检查 JSON 格式。");
        return;
    }

    var _token = "";
    var _modelConfig_map = -1;
    var _archive_map = -1;

    if (ds_map_exists(_account_map, "token")) {
        _token = ds_map_find_value(_account_map, "token");
    }
    
    if (ds_map_exists(_account_map, "modelConfig")) {
        _modelConfig_map = ds_map_find_value(_account_map, "modelConfig"); // 这是个 map (对应 UserModelConfig)
    }

    if (ds_map_exists(_account_map, "archive")) {
        _archive_map = ds_map_find_value(_account_map, "archive"); // 这是个 map (对应 SlelectedArchive)
    }
    
    if (_token == "") {
        scr_actionsLogUpdate("错误: 配置文件中缺少 token。");
        ds_map_destroy(_account_map);
        return;
    }
    
    var _request_body_map = ds_map_create();
    ds_map_add(_request_body_map, "message", _content);
    
    var _modelConfig_copy = -1;
    var _archive_copy = -1;
    
    if (_modelConfig_map != -1) {
        var _str = json_encode(_modelConfig_map);
        _modelConfig_copy = json_decode(_str);
    } else {
        _modelConfig_copy = ds_map_create(); // 空 map
    }
    
    if (_archive_map != -1) {
        var _str = json_encode(_archive_map);
        _archive_copy = json_decode(_str);
    } else {
        _archive_copy = ds_map_create(); // 空 map
    }
    
    ds_map_add_map(_request_body_map, "modelConfig", _modelConfig_copy);
    ds_map_add_map(_request_body_map, "archive", _archive_copy);
    ds_map_add(_request_body_map, "npcCall", _npc_name);
    
    var _json_body = json_encode(_request_body_map);
    
    var _headers = ds_map_create();
    ds_map_add(_headers, "Content-Type", "application/json");
    ds_map_add(_headers, "Authorization", _token); // Token 直接作为 Authorization 的值 (根据需求，可能需要 "Bearer " 前缀，但用户只说 "将token置为Authorization字段")
    
    var api_url = "https://www.ai.pinkprisma.com/not_stone_api/ai-npc/send"
    var api_url_local = "http://localhost:3007/ai-npc/send"
    global.my_request_id = http_request(api_url_local, "POST", _headers, _json_body);
    
    ds_map_destroy(_headers);
    ds_map_destroy(_request_body_map); // 这也会销毁 _modelConfig_copy 和 _archive_copy (因为用了 ds_map_add_map)
    ds_map_destroy(_account_map); // 销毁原始配置 map

}
