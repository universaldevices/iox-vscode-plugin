#!/usr/bin/env python3

"""
Plugin schema processor and validator
Copyright (C) 2024 Universal Devices
"""
from ioxplugin import Plugin, init_ext_logging, PLUGIN_LOGGER, IoXPluginLoggedException
import argparse, venv,os, subprocess
import shutil
bash_path = shutil.which('bash')

DOT_ENV_FILE = '.venv'

def generate_code():
    project_path = "/usr/home/admin/workspace/crap1"
    json_file = f"{project_path}/sensors.iox_plugin.json"
    if not os.path.exists(bash_path):
        raise IoXPluginLoggedException("bash shell not found, is it installed on the system?")

    try:
        parser = argparse.ArgumentParser(description="the path IoX Plugin json file")
    
        parser.add_argument('project_path', type=str, help='path to the project directory')
        parser.add_argument('json_file', type=str, help='path to the json file')
        
        args = parser.parse_args()
        project_path = args.project_path
        json_file = args.json_file
        init_ext_logging(project_path)

    except SystemExit as ex:
        pass

    mod=Plugin(json_file, project_path)
    mod.toIoX()
    mod.generateCode(project_path)
    try:
        venv_path=os.path.join(project_path, DOT_ENV_FILE)
        PLUGIN_LOGGER.info(f"creating a virtual env in {venv_path}, bash path is {bash_path} ...")
        venv.create(venv_path, with_pip=True)
        script_path=os.path.join(venv_path, 'bin', 'activate')

        output='echo "virtual env activated ... "'
        subprocess.run(f"source {script_path} && {output}", shell=True, executable=bash_path)

        PLUGIN_LOGGER.info("installing requiremnets into the virtual env ...")
        script_path=os.path.join(venv_path, 'bin', 'pip3')
        requirements_path=os.path.join(project_path, 'requirements.txt')
        output='echo "requirements installed successfully ... "'
        subprocess.run(f"{script_path} install -r {requirements_path}", shell=True, executable=bash_path)


    except Exception as ex:
        IoXPluginLoggedException("failed creating a project ")
        
if __name__ == "__main__":
    generate_code()

