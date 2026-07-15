-- Citas de ejemplo entre estudiantes (cadetes/tropa) y orientadores.
-- Ejecutar: docker exec -i dspacedb psql -U dspace -d biblioteca_auth < datos-ejemplo/citas-ejemplo.sql
-- Idempotente: borra primero las citas de estos estudiantes de ejemplo.

DELETE FROM citas WHERE estudiante_id IN (
    SELECT id FROM usuarios WHERE email IN (
        'cadete.perez@henm.edu.mx','cadete.gomez@henm.edu.mx',
        'soldado.ramos@henm.edu.mx','cabo.mendoza@henm.edu.mx'
    )
);

-- 1. PENDIENTE: cadete solicita orientación vocacional
INSERT INTO citas (estudiante_id, orientador_id, fecha_hora, duracion_minutos, modalidad, ubicacion, motivo, descripcion_estudiante, estado)
SELECT e.id, o.id, '2026-07-20 10:00:00', 60, 'presencial', 'Cubículo de Orientación 1',
       'Orientación vocacional', 'Quisiera revisar opciones de especialidad al egresar.', 'pendiente'
FROM usuarios e, usuarios o
WHERE e.email = 'cadete.perez@henm.edu.mx' AND o.email = 'psic.ramirez@henm.edu.mx';

-- 2. ACEPTADA: cadete con el teniente consejero
INSERT INTO citas (estudiante_id, orientador_id, fecha_hora, duracion_minutos, modalidad, ubicacion, motivo, descripcion_estudiante, estado)
SELECT e.id, o.id, '2026-07-17 09:00:00', 45, 'presencial', 'Oficina de Consejería Militar',
       'Adaptación a la vida militar', 'Me gustaría hablar sobre el ritmo de la escuela.', 'aceptada'
FROM usuarios e, usuarios o
WHERE e.email = 'cadete.gomez@henm.edu.mx' AND o.email = 'teniente.vargas@henm.edu.mx';

-- 3. COMPLETADA: cita pasada con notas del orientador
INSERT INTO citas (estudiante_id, orientador_id, fecha_hora, duracion_minutos, modalidad, ubicacion, motivo, estado, notas_orientador, created_at, fecha_completada)
SELECT e.id, o.id, '2026-07-08 11:00:00', 60, 'presencial', 'Cubículo de Orientación 2',
       'Manejo de estrés en evaluaciones', 'completada',
       'Se trabajaron técnicas de respiración y organización del tiempo. Seguimiento en 3 semanas.',
       '2026-07-06 09:30:00', '2026-07-08 12:00:00'
FROM usuarios e, usuarios o
WHERE e.email = 'soldado.ramos@henm.edu.mx' AND o.email = 'psic.martinez@henm.edu.mx';

-- 4. RECHAZADA: con motivo (el orientador propone reagendar)
INSERT INTO citas (estudiante_id, orientador_id, fecha_hora, duracion_minutos, modalidad, motivo, estado, motivo_rechazo)
SELECT e.id, o.id, '2026-07-21 12:00:00', 60, 'virtual',
       'Consulta sobre plan de estudios', 'rechazada',
       'Horario no disponible por comisión; favor de solicitar en la semana del 28 de julio.'
FROM usuarios e, usuarios o
WHERE e.email = 'cabo.mendoza@henm.edu.mx' AND o.email = 'psic.lopez@henm.edu.mx';

SELECT c.id, e.email AS estudiante, o.email AS orientador, c.fecha_hora, c.estado
FROM citas c
JOIN usuarios e ON e.id = c.estudiante_id
JOIN usuarios o ON o.id = c.orientador_id
ORDER BY c.id;
