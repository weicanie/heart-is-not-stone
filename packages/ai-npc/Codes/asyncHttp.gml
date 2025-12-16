// 确保全局变量存在，避免报错
if (variable_global_exists("my_request_id"))
{

    var _id = ds_map_find_value(async_load, "id");
    
    // 检查是否是我们发起的请求
    if (_id == global.my_request_id)
    {
        var _status = ds_map_find_value(async_load, "status");
        if (_status == 0)
        {
            var _result = ds_map_find_value(async_load, "result");
            var _http_status = ds_map_find_value(async_load, "http_status");
            if ((_http_status >= 200 && _http_status <= 300) || _http_status == 304)
            {
                var _content_npc = ""
                var _response_map = json_decode(_result);
                if (_response_map != -1) {
                    if (ds_map_exists(_response_map, "data")) {
                        var _data = ds_map_find_value(_response_map, "data");
                        if (is_undefined(_data) || !is_real(_data) || !ds_exists(_data, ds_type_map)) {
                            scr_actionsLogUpdate("Error: 'data' field is null, undefined, or not a map");
                            ds_map_destroy(_response_map);

                            _content_npc = "(暂时无法进行对话，请查看游戏日志)";

                            var _obj_ind = asset_get_index("o_dialogue");
                            var _dialogue_inst = instance_find(_obj_ind, 0);
                            if(instance_exists(_dialogue_inst)) {
                                with(_dialogue_inst) {
                                    scr_dialogue_set_text(_content_npc);
                                    
                                    var _render_ind = asset_get_index("o_dialogRender");
                                    if (instance_exists(_render_ind)) {
                                        with(instance_find(_render_ind, 0)) {
                                            // 确保渲染状态同步
                                            if (variable_instance_exists(other, "is_activate")) {
                                                surfaceDraw = other.is_activate;
                                            }
                                            event_user(0); 
                                        }
                                    }
                                }
                            }

                            return;
                        }
                            
                        if (ds_map_exists(_data, "msg")) {
                            var _speaker = ds_map_find_value(_data, "speaker")
                            if(_speaker == "") {
                                _speaker = "?"
                            }
                            var _msg = ds_map_find_value(_data, "msg");
                            scr_actionsLogUpdate(_speaker+": " + string(_msg));
                            
                            var _content_to_show = string(_msg);
                            
                            _content_npc = _content_npc + _content_to_show;
                        }
                    
                        if (ds_map_exists(_data, "mod_action_msg")) {
                            var _mod_action_msg = ds_map_find_value(_data, "mod_action_msg");
                            scr_actionsLogUpdate(string(_mod_action_msg));

                            _content_npc = _content_npc +"\n"+ "*" +"\n" + string(_mod_action_msg);
                        }

                        if (ds_map_exists(_data, "action")) {
                            var _action_list = ds_map_find_value(_data, "action");
                            if (ds_exists(_action_list, ds_type_list)) {
                                var _list_size = ds_list_size(_action_list);
                                for (var i = 0; i < _list_size; i++) {
                                    var _action = ds_list_find_value(_action_list, i);
                                    
                                    if (ds_map_exists(_action, "msg")) {
                                        var _action_msg = ds_map_find_value(_action, "msg");
                                        scr_actionsLogUpdate(string(_action_msg));
                                        _content_npc = _content_npc + string(_action_msg);
                                    }
                                    
                                    if (ds_map_exists(_action, "code")) {
                                        var _code = ds_map_find_value(_action, "code");
                                        var _code_val = -1;

                                        if (is_real(_code)) {
                                            _code_val = _code;
                                        } else if (is_string(_code)) {
                                            if (string_length(string_digits(_code)) > 0) {
                                                _code_val = real(_code);
                                            }
                                        }

                                        var _cnt_val = 0;
                                        var _has_cnt = ds_map_exists(_action, "cnt");
                                        if (_has_cnt) {
                                            var _cnt = ds_map_find_value(_action, "cnt");
                                            if (is_real(_cnt)) {
                                                _cnt_val = _cnt;
                                            } else if (is_string(_cnt) && string_length(string_digits(_cnt)) > 0) {
                                                _cnt_val = real(_cnt);
                                            }
                                        }
                                        var _itemKey = "";
                                        var hasItemKey = ds_map_exists(_action, "itemKey");
                                        if(hasItemKey) {
                                            _itemKey = ds_map_find_value(_action,"itemKey");
                                        }

                                        if (_code_val == 1 && _has_cnt) {
                                            scr_gold_add(_cnt_val);
                                        }
                                        
                                        if (_code_val == 2 && _has_cnt) {
                                            scr_atr_incr("XP", _cnt_val)
                                        }

                                        if (_code_val == 3 && _has_cnt) {
                                            // 使用玩家当前的全局网格坐标
                                            var _gridX = global.playerGridX;
                                            var _gridY = global.playerGridY;
                                            
                                            scr_globaltile_reputation_update(_cnt_val, _gridX, _gridY);
                                            scr_actionsLogUpdate("区域声望变更: " + string(_cnt_val));
                                        }

                                        if (_code_val == 4 && _has_cnt) {
                                            var _npcKey = "";
                                            var _isAll = false;
                                            
                                            if (ds_map_exists(_action, "npcKey")) {
                                                _npcKey = ds_map_find_value(_action, "npcKey");
                                                
                                                if (_npcKey != "" && variable_global_exists("caravanFollowersList")) {
                                                    var _target_name_lower = string_lower(_npcKey);
                                                    var _exact_match_found = false;
                                                    var _partial_match_key = "";
                                                    
                                                    var _list_size_caravan = ds_list_size(global.caravanFollowersList);
                                                    for (var j = 0; j < _list_size_caravan; j++) {
                                                        var _followerData = ds_list_find_value(global.caravanFollowersList, j);
                                                        if (ds_map_exists(_followerData, "npc_key")) {
                                                            var _current_full_key = ds_map_find_value(_followerData, "npc_key");
                                                            var _current_lower = string_lower(_current_full_key);
                                                            
                                                            if (_current_full_key == _npcKey) {
                                                                _exact_match_found = true;
                                                                break; 
                                                            }
                                                            
                                                            if (_partial_match_key == "" && string_pos(_target_name_lower, _current_lower) > 0) {
                                                                _partial_match_key = _current_full_key;
                                                            }
                                                        }
                                                    }
                                                    
                                                    if (_exact_match_found) {
                                                    } else if (_partial_match_key != "") {
                                                        _npcKey = _partial_match_key;
                                                    } 
                                                }
                                                
                                                if (ds_map_exists(_action, "isAll")) {
                                                    var _isAllVal = ds_map_find_value(_action, "isAll");
                                                    if (is_real(_isAllVal)) {
                                                        _isAll = (_isAllVal > 0);
                                                    } else if (is_string(_isAllVal)) {
                                                        _isAll = (_isAllVal == "true");
                                                    } else {
                                                        _isAll = bool(_isAllVal);
                                                    }
                                                }
                                                
                                                if (_npcKey == "") {
                                                    _isAll = true;
                                                }

                                                scr_caravanFollowerLoyaltyAdd(_npcKey, _cnt_val, _isAll);
                                                
                                                if (_isAll) {
                                                    scr_actionsLogUpdate("车队全员归属度变更: " + string(_cnt_val));
                                                } else {
                                                    scr_actionsLogUpdate("NPC(" + string(_npcKey) + ")归属度变更: " + string(_cnt_val));
                                                }
                                            }
                                        }

                                        if(_code_val == 8) {
                                            var _is_hostile = 1; 
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
                                                            scr_actionsLogUpdate("你被攻击了！");
                                                        } else {
                                                            _npc.state = "idle";
                                                            _npc.target = -4; // null
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        if(_code_val == 9 && hasItemKey) {
                                            var _item_str = _itemKey;
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

                                                        repeat(1) {
                                                            script_execute(_scr_add, _item_obj, _owner_inst);
                                                        }
                                                        scr_actionsLogUpdate("新物品: " + string(_item_str) + " x" + string(1));
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

                                    }
                                }
                            }
                        } 

                        _content_npc = _content_npc + "*";

                        var _obj_ind = asset_get_index("o_dialogue");
                        var _dialogue_inst = instance_find(_obj_ind, 0);
                        if(instance_exists(_dialogue_inst)) {
                            with(_dialogue_inst) {
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


                    } else {
                        scr_actionsLogUpdate("not_stone: " + string(_result));
                    }

                ds_map_destroy(_response_map);

                } else {
                    scr_actionsLogUpdate("not_stone: " + string(_result));
                }
            }
            else {
                scr_actionsLogUpdate("API错误: HTTP " + string(_http_status));
            }
        }
        else if (_status < 0)
        {
            scr_actionsLogUpdate("API错误: 网络请求失败");
        }
    }
}

