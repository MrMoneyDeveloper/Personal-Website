from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets' / 'models' / 'digital_portal.glb'

positions: list[float] = []
normals: list[float] = []
texcoords: list[float] = []
indices: list[int] = []


def add_face(vertices, normal, uv_size):
    base = len(positions) // 3
    for vx, vy, vz in vertices:
        positions.extend((vx, vy, vz))
        normals.extend(normal)

    u, v = uv_size
    texcoords.extend((0.0, 0.0, u, 0.0, u, v, 0.0, v))
    indices.extend((base, base + 1, base + 2, base, base + 2, base + 3))


def add_box(x0, x1, y0, y1, z0, z1, tile=0.82):
    width = abs(x1 - x0) * tile
    height = abs(y1 - y0) * tile
    depth = abs(z1 - z0) * tile

    add_face(((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)), (0.0, 0.0, 1.0), (width, height))
    add_face(((x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0)), (0.0, 0.0, -1.0), (width, height))
    add_face(((x1, y0, z1), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1)), (1.0, 0.0, 0.0), (depth, height))
    add_face(((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0)), (-1.0, 0.0, 0.0), (depth, height))
    add_face(((x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (x0, y1, z0)), (0.0, 1.0, 0.0), (width, depth))
    add_face(((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)), (0.0, -1.0, 0.0), (width, depth))


for box in (
    (-1.92, -1.12, -2.42, 2.42, -0.38, 0.38),
    (1.12, 1.92, -2.42, 2.42, -0.38, 0.38),
    (-1.92, 1.92, 1.72, 2.42, -0.38, 0.38),
    (-2.32, 2.32, -2.88, -2.14, -0.68, 0.68),
    (-1.02, -0.68, -1.82, 1.82, -0.18, 0.18),
    (0.68, 1.02, -1.82, 1.82, -0.18, 0.18),
    (-1.02, 1.02, 1.46, 1.82, -0.18, 0.18),
    (-1.22, 1.22, -1.96, -1.72, -0.12, 0.12),
):
    add_box(*box)


def pad4(data: bytes, fill: bytes = b'\x00') -> bytes:
    return data + (fill * ((4 - (len(data) % 4)) % 4))


position_min = [min(positions[i::3]) for i in range(3)]
position_max = [max(positions[i::3]) for i in range(3)]

index_bytes = struct.pack(f'<{len(indices)}H', *indices)
position_bytes = struct.pack(f'<{len(positions)}f', *positions)
normal_bytes = struct.pack(f'<{len(normals)}f', *normals)
uv_bytes = struct.pack(f'<{len(texcoords)}f', *texcoords)

bin_blob = bytearray()

def append_chunk(chunk: bytes) -> tuple[int, int]:
    offset = len(bin_blob)
    bin_blob.extend(chunk)
    while len(bin_blob) % 4:
        bin_blob.append(0)
    return offset, len(chunk)

index_offset, index_length = append_chunk(index_bytes)
pos_offset, pos_length = append_chunk(position_bytes)
norm_offset, norm_length = append_chunk(normal_bytes)
uv_offset, uv_length = append_chunk(uv_bytes)

model = {
    'asset': {
        'version': '2.0',
        'generator': 'Codex digital portal generator',
        'copyright': 'Portal mesh by OpenAI Codex. Textures referenced separately from Poly Haven under CC0.'
    },
    'scene': 0,
    'scenes': [{'nodes': [0]}],
    'nodes': [{'mesh': 0, 'name': 'DigitalPortal'}],
    'meshes': [{
        'name': 'DigitalPortal',
        'primitives': [{
            'attributes': {'POSITION': 1, 'NORMAL': 2, 'TEXCOORD_0': 3},
            'indices': 0,
            'material': 0
        }]
    }],
    'materials': [{
        'name': 'PortalMetal',
        'pbrMetallicRoughness': {
            'baseColorTexture': {'index': 0},
            'metallicRoughnessTexture': {'index': 2},
            'metallicFactor': 1.0,
            'roughnessFactor': 1.0
        },
        'normalTexture': {'index': 1, 'scale': 1.0},
        'occlusionTexture': {'index': 2, 'strength': 0.65},
        'emissiveFactor': [0.015, 0.05, 0.08],
        'doubleSided': False
    }],
    'textures': [
        {'sampler': 0, 'source': 0},
        {'sampler': 0, 'source': 1},
        {'sampler': 0, 'source': 2},
    ],
    'samplers': [{
        'magFilter': 9729,
        'minFilter': 9987,
        'wrapS': 10497,
        'wrapT': 10497
    }],
    'images': [
        {
            'uri': '../textures/polyhaven/blue-metal-plate/blue_metal_plate_diff_1k.jpg',
            'mimeType': 'image/jpeg',
            'name': 'BlueMetalPlateDiffuse'
        },
        {
            'uri': '../textures/polyhaven/blue-metal-plate/blue_metal_plate_nor_gl_1k.jpg',
            'mimeType': 'image/jpeg',
            'name': 'BlueMetalPlateNormal'
        },
        {
            'uri': '../textures/polyhaven/blue-metal-plate/blue_metal_plate_arm_1k.jpg',
            'mimeType': 'image/jpeg',
            'name': 'BlueMetalPlateARM'
        }
    ],
    'buffers': [{'byteLength': len(bin_blob)}],
    'bufferViews': [
        {'buffer': 0, 'byteOffset': index_offset, 'byteLength': index_length, 'target': 34963},
        {'buffer': 0, 'byteOffset': pos_offset, 'byteLength': pos_length, 'target': 34962},
        {'buffer': 0, 'byteOffset': norm_offset, 'byteLength': norm_length, 'target': 34962},
        {'buffer': 0, 'byteOffset': uv_offset, 'byteLength': uv_length, 'target': 34962},
    ],
    'accessors': [
        {'bufferView': 0, 'componentType': 5123, 'count': len(indices), 'type': 'SCALAR', 'max': [max(indices)], 'min': [min(indices)]},
        {'bufferView': 1, 'componentType': 5126, 'count': len(positions) // 3, 'type': 'VEC3', 'max': position_max, 'min': position_min},
        {'bufferView': 2, 'componentType': 5126, 'count': len(normals) // 3, 'type': 'VEC3'},
        {'bufferView': 3, 'componentType': 5126, 'count': len(texcoords) // 2, 'type': 'VEC2'},
    ]
}

json_blob = json.dumps(model, separators=(',', ':')).encode('utf-8')
json_blob = pad4(json_blob, b' ')
bin_blob = pad4(bytes(bin_blob))

total_length = 12 + 8 + len(json_blob) + 8 + len(bin_blob)
header = struct.pack('<4sII', b'glTF', 2, total_length)
json_header = struct.pack('<I4s', len(json_blob), b'JSON')
bin_header = struct.pack('<I4s', len(bin_blob), b'BIN\x00')

OUTPUT.write_bytes(header + json_header + json_blob + bin_header + bin_blob)
print(f'Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)')
