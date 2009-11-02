#!/usr/bin/env php
<?php
//This is the base path to the files in SVN
$base_path = '../trunk/src/javascript/';


error_reporting(E_ALL);
define('BR', "\n");

$files = array();
if ($handle = opendir($base_path)) {
    while (false !== ($file = readdir($handle))) {
        if ($file != "." && $file != ".." && $file != ".svn") {
            if (strpos($file, '.js')) {
                $name = str_replace('.js', '', $file);
                $files[$name] = $file;
            }
        }
    }
    closedir($handle);
}

//print_r($files);

echo "Making Directories".BR;

`rm -rRf ./src`;
`rm -rRf ./build`;
mkdir('./src');
mkdir('./build');

foreach($files as $name => $file) {
    $dir = './src/alloy-'.$name;
    echo("Creating Module: $name".BR);
    @mkdir($dir);
    @mkdir($dir.'/js');
    @mkdir($dir.'/assets');
    @mkdir($dir.'/tests');
    touch($dir.'/build.xml');
    touch($dir.'/build.properties');
    touch($dir.'/assets/.keep');
    touch($dir.'/tests/.keep');
    copy($base_path.$file, $dir.'/js/'.$file);
    copy('./build.xml', $dir.'/build.xml');
    
    $file_str = <<<END
builddir=../../../builder/componentbuild
component=alloy-{$name}
component.jsfiles={$file}
END;
    file_put_contents($dir.'/build.properties', $file_str);
}

?>
