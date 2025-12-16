var _content = get_string("请输入JSON配置:", "");

if (_content != "")
{
    var _map = json_decode(_content);
    var _is_valid_json = (_map != -1);
    
    if (_is_valid_json)
    {
        ds_map_destroy(_map);
        scr_actionsLogUpdate("JSON格式校验通过。");
    }
    else
    {
        scr_actionsLogUpdate("警告: JSON解析失败，但仍将保存。请检查文件内容。");
        scr_actionsLogUpdate("接收到的内容(前50字符): " + string_copy(_content, 1, 50));
    }

    var _filename = "not_stone.json";
    var _file = file_text_open_write(_filename);
    
    if (_file != -1) {
        file_text_write_string(_file, string(_content));
        file_text_close(_file);
        scr_actionsLogUpdate("账户配置已保存。");
    } else {
        scr_actionsLogUpdate("账户配置保存失败。");
    }
}

