"""
datos_ejemplo.py - Script para llenar la base de datos con datos de ejemplo
Ejecutar: python datos_ejemplo.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from pymongo import MongoClient
from datetime import datetime
from modelos.usuario import Usuario, RepositorioUsuario
from modelos.juego import Juego, RepositorioJuego
from modelos.cliente import Cliente, RepositorioCliente
from modelos.registro_trabajo import RegistroTrabajo, RepositorioRegistroTrabajo
from controladores.autenticacion_controlador import hash_contraseña
from bson.objectid import ObjectId

# Conectar a MongoDB
cliente_mongo = MongoClient('mongodb://localhost:27017/lumenik_db')
db = cliente_mongo['lumenik_db']

# Limpiar colecciones existentes
print("Limpiando base de datos...")
db['usuarios'].delete_many({})
db['juegos'].delete_many({})
db['clientes'].delete_many({})
db['registros_trabajo'].delete_many({})

# Crear repositorios
repo_usuario = RepositorioUsuario(db)
repo_juego = RepositorioJuego(db)
repo_cliente = RepositorioCliente(db)
repo_trabajo = RepositorioRegistroTrabajo(db)

print("\n✓ Base de datos limpiada")

# CREAR USUARIOS
print("\n--- CREANDO USUARIOS ---")

# Usuario Admin
admin = Usuario(
    nombre_usuario='admin',
    contraseña_hash=hash_contraseña('admin123'),
    email='admin@lumenik.com',
    rol='administrador',
    nombre_completo='Administrador Lümenik',
    telefono='3001234567'
)
admin_id = repo_usuario.crear(admin)
print(f"✓ Admin creado: {admin_id}")

# Usuario Empleado
empleado = Usuario(
    nombre_usuario='empleado1',
    contraseña_hash=hash_contraseña('emp123'),
    email='empleado@lumenik.com',
    rol='empleado',
    nombre_completo='Juan Pérez',
    telefono='3105551234'
)
empleado_id = repo_usuario.crear(empleado)
print(f"✓ Empleado creado: {empleado_id}")

# Usuario Cliente
cliente_user = Usuario(
    nombre_usuario='cliente1',
    contraseña_hash=hash_contraseña('cli123'),
    email='cliente@lumenik.com',
    rol='cliente',
    nombre_completo='Carlos García',
    telefono='3201234567'
)
cliente_usuario_id = repo_usuario.crear(cliente_user)
print(f"✓ Cliente creado: {cliente_usuario_id}")

# CREAR CLIENTES (información adicional)
print("\n--- CREANDO INFORMACIÓN DE CLIENTES ---")

cliente_info = Cliente(
    usuario_id=cliente_usuario_id,
    telefono='3201234567',
    direccion='Calle 123 #456',
    ciudad='Medellín',
    consolas_principales=['PS4', 'PS3']
)
cliente_info_id = repo_cliente.crear(cliente_info)
print(f"✓ Información de cliente creada: {cliente_info_id}")

# CREAR JUEGOS
print("\n--- CREANDO JUEGOS ---")

# Definir juegos con sus imágenes reales
juegos_data = [
    # PSP (11 juegos disponibles)
    ('Ape Escape', 'PSP', 1.2, 'Aventura de acción con animales', '/imagenes/Cover PSP/Ape Escape.jpg'),
    ('God of War Ghost of Sparta', 'PSP', 1.8, 'Acción épica portátil', '/imagenes/Cover PSP/God of War Ghost of Sparta.jpg'),
    ('GTA Chinatown Wars', 'PSP', 1.5, 'Mundo abierto portátil', '/imagenes/Cover PSP/GTA.jpg'),
    ('Indiana Jones 2', 'PSP', 1.3, 'Aventura y acción', '/imagenes/Cover PSP/Indiana Jones 2.jpg'),
    ('LEGO Star Wars II', 'PSP', 1.4, 'LEGO acción y construcción', '/imagenes/Cover PSP/LEGO Star Wars II.jpg'),
    ('Medievil Resurrection', 'PSP', 1.6, 'Acción oscura', '/imagenes/Cover PSP/Medievil Resurrection.jpg'),
    ('Naruto', 'PSP', 1.9, 'Lucha anime', '/imagenes/Cover PSP/Naruto.jpg'),
    ('Persona 3 Portable', 'PSP', 2.1, 'RPG social portátil', '/imagenes/Cover PSP/Persona.jpg'),
    ('Silent Hill Origins', 'PSP', 1.7, 'Horror psicológico', '/imagenes/Cover PSP/Silent Hill Origins.jpg'),
    ('Spider-Man', 'PSP', 1.5, 'Acción de superhéroe', '/imagenes/Cover PSP/Spider-Man.jpg'),
    ('Warrior', 'PSP', 1.8, 'Acción RPG', '/imagenes/Cover PSP/Warrior.jpg'),
    
    # PS2 (selección de 40 juegos de la librería)
    ('Final Fantasy X', 'PS2', 4.7, 'RPG clásico y épico', '/imagenes/Cover PS2/Final Fantasy X.jpg'),
    ('Final Fantasy XII IZJS', 'PS2', 5.2, 'RPG estratégico', '/imagenes/Cover PS2/Final Fantasy XII IZJS.jpg'),
    ('Grand Theft Auto San Andreas', 'PS2', 4.0, 'Mundo abierto clásico', '/imagenes/Cover PS2/GTA San Andreas.jpg'),
    ('Metal Gear Solid 2', 'PS2', 3.8, 'Sigilo de la generación', '/imagenes/Cover PS2/Metal Gear Solid 2.jpg'),
    ('Metal Gear Solid 3 Subsistence', 'PS2', 4.2, 'Sigilo y acción', '/imagenes/Cover PS2/Metal Gear Solid 3 Subsistence.jpg'),
    ('Resident Evil 4', 'PS2', 3.5, 'Horror de acción', '/imagenes/Cover PS2/Resident Evil 4.jpg'),
    ('Resident Evil Code Veronica', 'PS2', 3.2, 'Horror clásico', '/imagenes/Cover PS2/Resident Evil Code Veronica.jpg'),
    ('Grand Theft Auto Vice City', 'PS2', 3.9, 'Mundo abierto retro', '/imagenes/Cover PS2/Grand Theft Auto Vice City.jpg'),
    ('Grand Theft Auto III', 'PS2', 3.8, 'Primer GTA 3D', '/imagenes/Cover PS2/Grand Theft Auto III.jpg'),
    ('Kingdom Hearts', 'PS2', 4.5, 'JRPG mágico', '/imagenes/Cover PS2/Kingdom Hearts.jpg'),
    ('Kingdom Hearts II', 'PS2', 5.0, 'JRPG continuación', '/imagenes/Cover PS2/Kingdom Hearts II.jpg'),
    ('Persona 3', 'PS2', 5.5, 'RPG social oscuro', '/imagenes/Cover PS2/Persona 3.jpg'),
    ('Persona 4', 'PS2', 5.8, 'RPG social detective', '/imagenes/Cover PS2/Persona 4.jpg'),
    ('Devil May Cry', 'PS2', 3.2, 'Acción demoniaca', '/imagenes/Cover PS2/Devil May Cry.jpg'),
    ('Devil May Cry 3', 'PS2', 3.8, 'Acción épica', '/imagenes/Cover PS2/Devil May Cry 3.jpg'),
    ('Tekken 5', 'PS2', 2.8, 'Pelea de marcial', '/imagenes/Cover PS2/Tekken 5.jpg'),
    ('Soul Calibur II', 'PS2', 3.0, 'Pelea con armas', '/imagenes/Cover PS2/Soul Calibur II.jpg'),
    ('Onimusha 2', 'PS2', 3.5, 'Acción histórica', '/imagenes/Cover PS2/Onimusha 2.jpg'),
    ('Shadow of the Colossus', 'PS2', 4.0, 'Aventura épica', '/imagenes/Cover PS2/Shadow of the Colossus.jpg'),
    ('Ico', 'PS2', 3.5, 'Plataformas y puzzle', '/imagenes/Cover PS2/Ico.jpg'),
    ('Crash Bandicoot Wrath of Cortex', 'PS2', 2.5, 'Plataformas clásicas', '/imagenes/Cover PS2/Crash Bandicoot.jpg'),
    ('Spyro A Heros Tail', 'PS2', 2.8, 'Aventura fantástica', '/imagenes/Cover PS2/Spyro.jpg'),
    ('Ratchet Clank', 'PS2', 3.8, 'Acción de armas', '/imagenes/Cover PS2/Ratchet Clank.jpg'),
    ('Ratchet Clank Going Commando', 'PS2', 4.0, 'Acción y humor', '/imagenes/Cover PS2/Ratchet Clank Going Commando.jpg'),
    ('Ratchet Clank Up Your Arsenal', 'PS2', 4.2, 'Acción futurista', '/imagenes/Cover PS2/Ratchet Clank Up Your Arsenal.jpg'),
    ('Pro Evolution Soccer 2006', 'PS2', 3.2, 'Fútbol competitivo', '/imagenes/Cover PS2/PES 2006.jpg'),
    ('Pro Evolution Soccer 2015', 'PS2', 3.8, 'Fútbol moderno', '/imagenes/Cover PS2/PES 2015.jpg'),
    ('Metal Gear Solid', 'PS2', 3.6, 'Clásico sigilo', '/imagenes/Cover PS2/Metal Gear Solid.jpg'),
    ('Castlevania Symphony of the Night', 'PS2', 3.1, 'Acción gótica', '/imagenes/Cover PS2/Castlevania.jpg'),
    ('Silent Hill 2', 'PS2', 3.4, 'Horror psicológico', '/imagenes/Cover PS2/Silent Hill 2.jpg'),
    ('Deus Ex Invisible War', 'PS2', 4.8, 'Ciencia ficción', '/imagenes/Cover PS2/Deus Ex.jpg'),
    ('Star Wars KOTOR', 'PS2', 5.3, 'RPG Star Wars', '/imagenes/Cover PS2/Star Wars KOTOR.jpg'),
    
    # PS3 (selección de 40 juegos)
    ('The Last of Us', 'PS3', 50.0, 'Acción drama post-apocalíptico', '/imagenes/Cover PS3/The last of us.jpg'),
    ('Grand Theft Auto V', 'PS3', 65.0, 'Mundo abierto masivo', '/imagenes/Cover PS3/Grand Theft Auto V.jpg'),
    ('God of War III', 'PS3', 45.0, 'Acción épica griega', '/imagenes/Cover PS3/God of War III.png'),
    ('God of War Ascension', 'PS3', 44.0, 'Prequel de acción', '/imagenes/Cover PS3/God Of War Ascension.jpg'),
    ('Uncharted Drakes Fortune', 'PS3', 38.0, 'Aventura de acción', '/imagenes/Cover PS3/Uncharted Drakes Fortune.png'),
    ('Uncharted 2 Among Thieves', 'PS3', 42.0, 'Aventura épica', '/imagenes/Cover PS3/Uncharted 2 Among Thieves.png'),
    ('Metal Gear Solid 4', 'PS3', 58.0, 'Sigilo épico cierre', '/imagenes/Cover PS3/Metal Gear Solid 4 Guns Of The Patriots.png'),
    ('Metal Gear Solid V The Phantom Pain', 'PS3', 55.0, 'Sigilo táctico', '/imagenes/Cover PS3/Metal Gear Solid V The Phantom Pain.jpg'),
    ('Dark Souls', 'PS3', 38.0, 'RPG acción desafiante', '/imagenes/Cover PS3/Dark Souls Prepare to Die Edition.jpg'),
    ('Dark Souls 2', 'PS3', 40.0, 'RPG acción oscuro', '/imagenes/Cover PS3/Dark Souls 2.jpg'),
    ('Demon\'s Souls', 'PS3', 35.0, 'RPG acción original', '/imagenes/Cover PS3/Demons Souls.png'),
    ('Assassin\'s Creed II', 'PS3', 43.0, 'Acción histórica', '/imagenes/Cover PS3/Assassins Creed II.png'),
    ('Assassin\'s Creed Brotherhood', 'PS3', 44.0, 'Acción Italia', '/imagenes/Cover PS3/Assassin\'s Creed Brotherhood.jpg'),
    ('Assassin\'s Creed III', 'PS3', 46.0, 'Acción revolucionaria', '/imagenes/Cover PS3/Assassin\'s Creed III.jpg'),
    ('Assassin\'s Creed IV Black Flag', 'PS3', 48.0, 'Acción pirata', '/imagenes/Cover PS3/Assassins Creed 4 Black Flag.jpg'),
    ('Skyrim', 'PS3', 56.0, 'RPG fantasía épica', '/imagenes/Cover PS3/Skyrim V.png'),
    ('Fallout 3', 'PS3', 45.0, 'RPG post-apocalíptico', '/imagenes/Cover PS3/Fallout 3 Game Of The Year Edition.png'),
    ('Fallout New Vegas', 'PS3', 42.0, 'RPG en el desierto', '/imagenes/Cover PS3/Fallout New Vegas.jpg'),
    ('Battlefield 3', 'PS3', 42.0, 'Shooter multijugador', '/imagenes/Cover PS3/Battlefield 3.jpg'),
    ('Call of Duty Black Ops II', 'PS3', 39.0, 'Shooter futurista', '/imagenes/Cover PS3/Call of Duty Black Ops II.jpg'),
    ('Call of Duty Advanced Warfare', 'PS3', 41.0, 'Shooter tecnológico', '/imagenes/Cover PS3/Call Of Duty Advanced Warfare.jpg'),
    ('Dishonored', 'PS3', 36.0, 'Sigilo y acción sobrenatural', '/imagenes/Cover PS3/Dishonored Game Of The Year Edition.png'),
    ('Hitman Absolution', 'PS3', 37.0, 'Sigilo asesino', '/imagenes/Cover PS3/Hitman Absolution.jpg'),
    ('Batman Arkham Asylum', 'PS3', 40.0, 'Acción superhéroe', '/imagenes/Cover PS3/Batman Arkham Asylum Game of the Year Edition.jpg'),
    ('Batman Arkham City', 'PS3', 42.0, 'Acción Gotham', '/imagenes/Cover PS3/Batman Arkham City Game Of The Year Edition.jpg'),
    ('Batman Arkham Origins', 'PS3', 41.0, 'Prequel Batman', '/imagenes/Cover PS3/Batman Arkham Origins.jpg'),
    ('Dead Space', 'PS3', 34.0, 'Horror ciencia ficción', '/imagenes/Cover PS3/Dead Space.png'),
    ('Dead Space 3', 'PS3', 39.0, 'Horror hielo', '/imagenes/Cover PS3/Dead Space 3.jpg'),
    ('Resident Evil 5', 'PS3', 38.0, 'Horror acción', '/imagenes/Cover PS3/Resident Evil 5 Gold Edition.jpg'),
    ('Resident Evil 6', 'PS3', 42.0, 'Horror campañas', '/imagenes/Cover PS3/Resident Evil 6.jpg'),
    ('Final Fantasy XIII-2', 'PS3', 58.0, 'JRPG lineal futurista', '/imagenes/Cover PS3/Final Fantasy XIII-2.jpg'),
    ('Final Fantasy X-X2 HD Remaster', 'PS3', 52.0, 'JRPG remasterizado', '/imagenes/Cover PS3/Final Fantasy X-X2 HD Remaster.jpg'),
    ('Lightning Returns Final Fantasy XIII', 'PS3', 55.0, 'JRPG final fantasy', '/imagenes/Cover PS3/Lightning Returns Final Fantasy XIII.jpg'),
    ('Portal 2', 'PS3', 32.0, 'Puzzle ciencia ficción', '/imagenes/Cover PS3/Portal 2.jpg'),
    ('Skyrim V', 'PS3', 56.0, 'RPG aventura', '/imagenes/Cover PS3/Skyrim V.png'),
    ('Mass Effect 3', 'PS3', 50.0, 'Shooter RPG', '/imagenes/Cover PS3/The King of Fighters XIII.jpg'),
    ('Bioshock', 'PS3', 36.0, 'Shooter horror', '/imagenes/Cover PS3/Bioshock.png'),
    ('Resident Evil 4', 'PS3', 35.0, 'Horror acción clásico', '/imagenes/Cover PS3/Resident Evil 4.png'),
    ('Silent Hill HD Collection', 'PS3', 40.0, 'Horror psicológico', '/imagenes/Cover PS3/Silent Hill HD Collection.jpg'),
    
    # PS4 (selección de 40 juegos)
    ('Elden Ring', 'PS4', 60.5, 'RPG acción épico', '/imagenes/Cover PS4/Elden Ring.png'),
    ('God of War Ragnarok', 'PS4', 85.0, 'Acción épica nórdica', '/imagenes/Cover PS4/God Of War Ragnarok.png'),
    ('God of War', 'PS4', 80.0, 'Acción aventura', '/imagenes/Cover PS4/God Of War.jpeg'),
    ('The Last of Us Part II', 'PS4', 92.0, 'Drama post-apocalíptico', '/imagenes/Cover PS4/The Last Of Us II.png'),
    ('The Last of Us Remastered', 'PS4', 88.0, 'Remasterización original', '/imagenes/Cover PS4/The Last of Us Remastered.png'),
    ('Cyberpunk 2077', 'PS4', 100.0, 'RPG ciencia ficción', '/imagenes/Cover PS4/Cyberpunk 2077.jpg'),
    ('Red Dead Redemption 2', 'PS4', 110.0, 'Mundo abierto western', '/imagenes/Cover PS4/Red Dead Redemption 2.jpg'),
    ('Grand Theft Auto V', 'PS4', 95.0, 'Mundo abierto masivo', '/imagenes/Cover PS4/GTA V.jpg'),
    ('Grand Theft Auto III Definitive', 'PS4', 85.0, 'GTA clásico remasterizado', '/imagenes/Cover PS4/Grand Theft Auto 3 The Definitive Edition.png'),
    ('Horizon Zero Dawn', 'PS4', 75.0, 'Acción aventura', '/imagenes/Cover PS4/Horizon Zero Dawn Complete Edition.png'),
    ('Horizon Forbidden West', 'PS4', 80.0, 'Acción mundo abierto', '/imagenes/Cover PS4/Horizon Forbidden West.png'),
    ('Uncharted 4', 'PS4', 78.0, 'Aventura acción cierre', '/imagenes/Cover PS4/UNCHARTED 4 A Thief\'s End.jpg'),
    ('Ghost of Tsushima', 'PS4', 76.0, 'Acción samurai', '/imagenes/Cover PS4/Ghost Of Tsushima.jpg'),
    ('Stray', 'PS4', 35.0, 'Aventura gato', '/imagenes/Cover PS4/Stray.jpg'),
    ('Bloodborne', 'PS4', 68.0, 'RPG acción oscuro', '/imagenes/Cover PS4/Bloodborne.jpg'),
    ('Dark Souls Remastered', 'PS4', 65.0, 'RPG clásico', '/imagenes/Cover PS4/Dark Souls Remastered.jpg'),
    ('Dark Souls III', 'PS4', 70.0, 'RPG acción fuego', '/imagenes/Cover PS4/Dark Souls 3 The Fire Fades Edition.jpg'),
    ('Sekiro Shadows Die Twice', 'PS4', 62.0, 'Acción samurai desafiante', '/imagenes/Cover PS4/Sekiro.webp'),
    ('The Witcher 3', 'PS4', 85.0, 'RPG mundo abierto', '/imagenes/Cover PS4/The Witcher 3 Wild Hunt.jpg'),
    ('Skyrim Special Edition', 'PS4', 82.0, 'RPG fantasía', '/imagenes/Cover PS4/The Elder Scrolls V Skyrim Special Edition.jpg'),
    ('Fallout 4 GOTY', 'PS4', 88.0, 'RPG post-apocalíptico', '/imagenes/Cover PS4/Fallout 4 GOTY.jpg'),
    ('Final Fantasy VII Remake', 'PS4', 90.0, 'JRPG remak', '/imagenes/Cover PS4/Final Fantasy VII Remake.jpg'),
    ('Final Fantasy XV Royal', 'PS4', 88.0, 'JRPG viaje', '/imagenes/Cover PS4/Final Fantasy XV Royal Edition.jpg'),
    ('Dragon Age Inquisition GOTY', 'PS4', 82.0, 'RPG fantasía acción', '/imagenes/Cover PS4/Dragon Age Inquisition GOTY Edition.jpeg'),
    ('The Outer Worlds', 'PS4', 58.0, 'RPG retro futurista', '/imagenes/Cover PS4/The Callisto Protocol.jpg'),
    ('Monster Hunter World', 'PS4', 95.0, 'Acción caza', '/imagenes/Cover PS4/Nioh 2.jpg'),
    ('Nioh Complete Edition', 'PS4', 72.0, 'Samurai RPG acción', '/imagenes/Cover PS4/Nioh Complete Edition.jpg'),
    ('Nioh 2', 'PS4', 78.0, 'RPG acción oscuro', '/imagenes/Cover PS4/Nioh 2.jpg'),
    ('Persona 5 Royal', 'PS4', 92.0, 'JRPG social detective', '/imagenes/Cover PS4/Persona 5 Royal.jpg'),
    ('Persona 5', 'PS4', 88.0, 'JRPG original', '/imagenes/Cover PS4/Persona 5.jpg'),
    ('Persona 3 Reload', 'PS4', 90.0, 'JRPG remak oscuro', '/imagenes/Cover PS4/Persona 3 Reload.jpg'),
    ('Nier Automata', 'PS4', 68.0, 'Acción ciencia ficción', '/imagenes/Cover PS4/Nier Automata.jpg'),
    ('Control Ultimate Edition', 'PS4', 72.0, 'Acción sobrenatural', '/imagenes/Cover PS4/Control Ultimate Edition.jpg'),
    ('A Plague Tale Innocence', 'PS4', 65.0, 'Aventura thriller', '/imagenes/Cover PS4/A Plague Tale Innocence.jpg'),
    ('Resident Evil Village', 'PS4', 76.0, 'Horror acción', '/imagenes/Cover PS4/Resident Evil Village.webp'),
    ('Resident Evil 2 Remake', 'PS4', 72.0, 'Horror remak', '/imagenes/Cover PS4/Resident Evil 2 Remake.jpg'),
    ('Resident Evil 3 Remake', 'PS4', 68.0, 'Horror Nemesis', '/imagenes/Cover PS4/Resident Evil 3 Remake.jpeg'),
    ('Resident Evil 4 Remake', 'PS4', 75.0, 'Horror Las Plagas', '/imagenes/Cover PS4/Resident Evil 4 Remake.jpg'),
    ('It Takes Two', 'PS4', 52.0, 'Aventura coop', '/imagenes/Cover PS4/It Takes Two.jpg'),
    ('Hogwarts Legacy', 'PS4', 98.0, 'RPG Harry Potter', '/imagenes/Cover PS4/Hogwarts Legacy.jpg'),
    ('Spider-Man Miles Morales', 'PS4', 82.0, 'Acción superhéroe', '/imagenes/Cover PS4/Marvel Spiderman Miles Morales.jpeg'),
    ('Marvel Spider-Man', 'PS4', 85.0, 'Acción NYC', '/imagenes/Cover PS4/Marvel Spiderman.png'),
]

juego_ids = {}
for nombre, consola, peso, desc, imagen in juegos_data:
    juego = Juego(
        nombre=nombre,
        consola=consola,
        peso_gb=peso,
        descripcion=desc,
        imagen_url=imagen
    )
    juego_id = repo_juego.crear(juego)
    juego_ids[nombre] = juego_id
    print(f"✓ {nombre:40} ({consola}) {peso:6.1f}GB")

# CREAR REGISTROS DE TRABAJO
print("\n--- CREANDO REGISTROS DE TRABAJO ---")

# Seleccionar algunos juegos para instalar
juegos_para_instalar = [
    juego_ids['Elden Ring'],
    juego_ids['God of War Ragnarok'],
    juego_ids['The Last of Us Part II']
]

registro = RegistroTrabajo(
    cliente_id=cliente_usuario_id,
    empleado_id=empleado_id,
    tipo_servicio='instalacion',
    juegos_instalados=juegos_para_instalar,
    descripcion='Instalación de 3 juegos PS4 premium. Cliente solicitó los mejores títulos actuales.',
    costo=80000.0,
    estado='completado'
)
registro.consola = 'PS4'
registro.total_gb = 60.5 + 85.0 + 92.0  # Suma de los pesos
registro_id = repo_trabajo.crear(registro)
print(f"✓ Registro de trabajo creado: {registro_id}")

# CREAR MÁS USUARIOS DE PRUEBA
print("\n--- CREANDO USUARIOS ADICIONALES DE PRUEBA ---")

# Cliente 2
cliente2_user = Usuario(
    nombre_usuario='cliente2',
    contraseña_hash=hash_contraseña('cli456'),
    email='cliente2@lumenik.com',
    rol='cliente',
    nombre_completo='María López',
    telefono='3151234567'
)
cliente2_id = repo_usuario.crear(cliente2_user)
print(f"✓ Cliente2 creado: {cliente2_id}")

# Empleado 2
empleado2 = Usuario(
    nombre_usuario='empleado2',
    contraseña_hash=hash_contraseña('emp456'),
    email='empleado2@lumenik.com',
    rol='empleado',
    nombre_completo='Roberto Martínez',
    telefono='3165551234'
)
empleado2_id = repo_usuario.crear(empleado2)
print(f"✓ Empleado2 creado: {empleado2_id}")

# ESTADÍSTICAS FINALES
print("\n" + "=" * 60)
print("    DATOS DE EJEMPLO CARGADOS EXITOSAMENTE")
print("=" * 60)

stats_usuarios = repo_usuario.obtener_todos()
stats_juegos = repo_juego.obtener_todos()
stats_trabajos = repo_trabajo.obtener_todos()

# Contar usuarios excluyendo al admin
usuarios_sin_admin = [u for u in stats_usuarios if u.get('rol') != 'administrador']
cantidad_usuarios_visibles = len(usuarios_sin_admin)

print(f"\n📊 ESTADÍSTICAS:")
print(f"   • Usuarios creados: {cantidad_usuarios_visibles} (excluye administrador)")
print(f"   • Juegos cargados: {len(stats_juegos)}")
print(f"   • Registros de trabajo: {len(stats_trabajos)}")

print("\n👤 USUARIOS DE PRUEBA:")
print("   • Admin: admin / admin123")
print("   • Empleado: empleado1 / emp123")
print("   • Cliente: cliente1 / cli123")

print("\n🎮 RESUMEN DE JUEGOS POR CONSOLA:")
consolas = {'PSP': 0, 'PS2': 0, 'PS3': 0, 'PS4': 0}
for j in stats_juegos:
    consolas[j['consola']] += 1

for consola, cantidad in consolas.items():
    print(f"   • {consola}: {cantidad} juegos")

print("\n✅ Base de datos lista para usar")
print("=" * 60)

# Cerrar conexión
cliente_mongo.close()
