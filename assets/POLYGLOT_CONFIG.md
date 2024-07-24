Very simple audio player for eisy. It can:
- Play the default sounds
- Play through the speaker jack on the back

## Professional Version

- You can upload your music in a zip file (size limit is 20M)
- It can play online stations 
- It can automatically convert your text to speech and play it
- Play through Paired Bluetooth speakers - you will also need the Bluetooth plugin (free)
- Remove entries
- Volume control

## Parameters:

1. path
    This is the path for storing your files. This can be any path but, if you change it, you will need to make sure you have ssh access to it in order to make give it the right permissions/ownership. If you're not a geek, leave it as is

2. stations 
    The value for this parameter is in the form of:
    name===url, name1===url1, name2===url2, ... 

3. For text to speech, create custom parameters 

    - key 
        tts_<source lang>_<dest_lang>_name-of-your-file
        e.g. tts_en_en_Hello-World
        This key converts the value (see below) from your English text (en) to voice in English (en).
    - value 
        The text of what you want spoken.
        e.g. Hello World!

## Important Note:
If your originally crated tts files do not work, rename them by adding a _t at the end of the file name. For instance
hello_world.mp3 -> hello_world_t.mp3

