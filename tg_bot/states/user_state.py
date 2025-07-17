from aiogram.fsm.state import State, StatesGroup


class UserStates(StatesGroup):
    language = State()
    session = State()
    level = State()
