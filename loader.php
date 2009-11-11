#!/usr/bin/env php
<?php

$base_path = './src/';

$files = $data = array();
if ($handle = opendir($base_path)) {
    while (false !== ($file = readdir($handle))) {
        if ($file != "." && $file != ".." && $file != ".svn") {
            if (is_dir($base_path.$file)) {
                if ($handle2 = opendir($base_path.$file)) {
                    while (false !== ($file2 = @readdir($handle2))) {
                        if (substr($file2, -11) == '.properties') {
                            $files[] = $base_path.$file.'/'.$file2;
                        }
                    }
                }
                closedir($handle2);
            }
        }
    }
    closedir($handle);
}


if (sizeOf($files)) {
    foreach ($files as $k => $prop) {
        $p = parseProp($prop);
        $data[$p['component']] = $p;
        unset($data[$p['component']]['component']);
    }

    foreach($data as $k => $info) {
        if ($info['submodules']) {
            foreach($info['submodules'] as $k2 => $v2) {
                $data[$k]['submodules'][$k2] = $data[$k2];
                unset($data[$k2]);
            }
        }
    }
}


echo(json_encode($data));
//print_r($data);

function parseProp($file) {
    $data = array();
    $str = file($file);
    foreach ($str as $num => $line) {
        $line = str_replace("\n", '', $line);
        if (substr($line, 0, 10) == 'component=') {
            $data['component'] = str_replace('component=', '', $line);
        }
        if (substr($line, 0, 19) == 'component.requires=') {
            $data['requires'] = str2array(str_replace('component.requires=', '', $line));
        }
        if (substr($line, 0, 19) == 'component.optional=') {
            $data['optional'] = str2array(str_replace('component.optional=', '', $line));
        }
        if (substr($line, 0, 21) == 'component.supersedes=') {
            $data['supersedes'] = str2array(str_replace('component.supersedes=', '', $line));
        }
        if (substr($line, 0, 14) == 'component.use=') {
            $data['submodules'] = str2array(str_replace('component.use=', '', $line), true);
        }
    }
    return $data;
}

function str2array($str, $assoc=false) {
    $str = str_replace(', ', ',', $str);
    $arr = explode(',', $str);
    $out = array();
    foreach($arr as $k => $v) {
        if ($v) {
            $out[$v] = array();
        }
    }
    if (!$assoc) {
        $out = array_keys($out);
    }
    return $out;
}


?>
