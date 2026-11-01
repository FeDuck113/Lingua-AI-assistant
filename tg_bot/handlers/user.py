import base64
import os
import subprocess
import uuid
from pathlib import Path

import httpx
from aiogram import Router, F, Bot, types
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, BotCommand, FSInputFile
from aiogram.utils.keyboard import InlineKeyboardBuilder

user_router = Router()

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

lang_codes = {
    'American English': 'english',
    'British English': 'english_b',
    'Spanish': 'spanish',
    'French': 'french',
    'Hindi': 'hindi',
    'Italian': 'italian',
    'Japanese': 'japanese',
    'Brazilian Portuguese': 'brazilian',
    'Mandarin Chinese': 'chinese'
}

API_BASE_URL = os.getenv("API_BASE_URL") or f"http://{os.getenv('API_HOST', 'localhost')}:3000"

async def set_commands(bot: Bot):
    commands = [
        BotCommand(command=f"lang_{lang.replace(' ', '_').lower()}", description=f"Сменить язык на {lang}")
        for lang in lang_codes
    ]
    commands.append(BotCommand(command='/clear', description=f"Очистить контекст."))
    await bot.set_my_commands(commands)


@user_router.message(F.voice)
async def handle_voice(m: Message, state: FSMContext):
    state_data = await state.get_data()
    session = state_data.get("session") or str(uuid.uuid4())
    if "session" not in state_data:
        await state.update_data(session=session)

    lang = state_data.get("language", "english")
    level = state_data.get("level", "B1")

    file = await m.bot.get_file(m.voice.file_id)
    ogg_path = TEMP_DIR / Path(file.file_path).name
    await m.bot.download_file(file.file_path, ogg_path)

    wav_path = ogg_path.with_suffix(".wav")

    waiting_message = await m.reply('\U000023F3')

    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", str(ogg_path),
            "-ar", "16000", "-ac", "1", str(wav_path)
        ], check=True)

        print('audio doshlo')
        async with httpx.AsyncClient() as client:
            with wav_path.open("rb") as f:
                files = {"file": (wav_path.name, f, "audio/wav")}
                data = {"username": str(m.from_user.id),
                        'language': lang,
                        'sessionUUID': session,
                        'level': level
                        }
                response = await client.post(f"{API_BASE_URL}/api/v1/audio", files=files, data=data)
                response.raise_for_status()
                response = response.json()

                audio_base64 = response["audio"]
                audio_bytes = base64.b64decode(audio_base64)

                temp_wav_path = TEMP_DIR / "temp.wav"
                with open(temp_wav_path, "wb") as f:
                    f.write(audio_bytes)

                ogg_path = TEMP_DIR / "temp.ogg"
                subprocess.run([
                    "ffmpeg", "-y", "-i", str(temp_wav_path),
                    "-c:a", "libopus", str(ogg_path)
                ], check=True)

                voice = FSInputFile(ogg_path)

                await m.answer(response['explanation'])
                await m.answer_voice(voice)

                for path in (temp_wav_path, ogg_path):
                    try:
                        path.unlink()
                    except FileNotFoundError:
                        pass



            await waiting_message.delete()
            # await m.answer('jdhjhjsdhsd')
            # await m.answer(resp.text if resp.status_code == 200 else f"error {resp.status_code}")
    finally:
        for path in (ogg_path, wav_path):
            try:
                path.unlink()
            except FileNotFoundError:
                pass

# @user_router.message(~F.voice and ~F.text.startswith("/"))
# async def handle_text(m: Message, state: FSMContext):
#     data = await state.get_data()
#     lang = data.get("language", "a")
#
#     waiting_message = await m.reply('\U000023F3')
#     await waiting_message.delete()
#
#     await m.answer(m.text)

# async with httpx.AsyncClient() as client:
#     data = {'user_id': str(m.from_user.id),
#             'message': m.text,
#             'language': lang}
#     response = await client.post("http://localhost:3000/api/v1/text", data=data)

# if response.status_code == 200:
#     await m.answer('ok')
# else:
#     await m.answer('error')


@user_router.message(lambda m: m.text.startswith("/lang_"))
async def set_language(m: Message, state: FSMContext):
    lang_command = m.text[6:].replace('_', ' ').title()
    if lang_command in lang_codes:
        code = lang_codes[lang_command]
        await state.update_data(language=code)
        await m.answer(f"Сменили язык на {lang_command} (код: {code})")
    else:
        await m.answer("Неизвестный язык!!!!!!!!")


@user_router.message(F.text == "/start")
async def start_handler(message: types.Message, state: FSMContext):
    gen_session = str(uuid.uuid4())
    await state.update_data(session=gen_session)

    text = (
        "<b>👋 Привет! Я — твой персональный языковой помощник.</b>\n\n"
        "🌍 Готов помочь тебе практиковать иностранный язык в любом темпе и на любом уровне!\n\n"
        "📚 Пожалуйста, выбери свой уровень владения языком, чтобы мы начали общение с комфортной сложности:\n\n"
        "👇 <b>Выбери уровень ниже:</b>"
    )

    builder = InlineKeyboardBuilder()
    levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    for i in range(0, len(levels), 2):
        builder.row(
            types.InlineKeyboardButton(text=f"{levels[i]}", callback_data=f"level_{levels[i]}"),
            types.InlineKeyboardButton(text=f"{levels[i + 1]}", callback_data=f"level_{levels[i + 1]}")
        )

    await message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")


@user_router.message(lambda m: m.text == ("/clear"))
async def clear_context(m: Message, state: FSMContext):
    # generate new session
    gen_session = str(uuid.uuid4())
    await state.update_data(session=gen_session)
    await m.answer('Контекст очищен!')


@user_router.callback_query(F.data.startswith("level_"))
async def level_chosen(callback: types.CallbackQuery, state: FSMContext):
    level = callback.data.split("_")[1]
    await state.update_data(level=level)
    await callback.answer(f"Вы выбрали уровень {level} 👌")
    await callback.message.edit_text(
        f"✅ Уровень <b>{level}</b> выбран. Можем начинать!",
        parse_mode="HTML"
    )
