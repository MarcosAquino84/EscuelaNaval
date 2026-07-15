#!/usr/bin/perl
# Usuarios de ejemplo con grados militares en Koha, con categorías propias
# (CAD Cadetes, TRP Tropa, OFC Oficiales). Mismas contraseñas que el panel
# para que funcione el auto-login. Ejecutar:
#   docker cp datos-ejemplo/koha-usuarios-ejemplo.pl koha:/tmp/
#   docker exec koha koha-shell biblioteca -c 'perl /tmp/koha-usuarios-ejemplo.pl'
use Modern::Perl;
use utf8;
use C4::Context;
use Koha::Patrons;
use Koha::Patron;
use Koha::Patron::Categories;
use Koha::Patron::Category;

# Categorías militares (vía API de objetos: el esquema SQL cambia entre versiones)
my @categorias = (
    ['CAD', 'Cadetes',                   'A'],
    ['TRP', 'Tropa (Soldados y Cabos)',  'A'],
    ['OFC', 'Oficiales',                 'A'],
);
for my $c (@categorias) {
    my ($code, $desc, $type) = @$c;
    if (Koha::Patron::Categories->find($code)) {
        print "Categoría $code: ya existía\n";
        next;
    }
    Koha::Patron::Category->new({
        categorycode    => $code,
        description     => $desc,
        category_type   => $type,
        enrolmentperiod => 99,
    })->store;
    print "Categoría $code ($desc): creada\n";
}

# userid = parte local del email (coincide con el fallback del auto-login)
my @patrones = (
    # userid, cardnumber, nombre, apellido, email, password, categoria, superlibrarian
    ['cadete.perez',    'CAD001', 'Luis',     'Pérez',   'cadete.perez@henm.edu.mx',    'Cadete123',   'CAD', 0],
    ['cadete.gomez',    'CAD002', 'Ana',      'Gómez',   'cadete.gomez@henm.edu.mx',    'Cadete123',   'CAD', 0],
    ['cadete.torres',   'CAD003', 'María',    'Torres',  'cadete.torres@henm.edu.mx',   'Cadete123',   'CAD', 0],
    ['soldado.ramos',   'TRP001', 'Pedro',    'Ramos',   'soldado.ramos@henm.edu.mx',   'Soldado123',  'TRP', 0],
    ['soldado.diaz',    'TRP002', 'Lucía',    'Díaz',    'soldado.diaz@henm.edu.mx',    'Soldado123',  'TRP', 0],
    ['cabo.mendoza',    'TRP003', 'Jorge',    'Mendoza', 'cabo.mendoza@henm.edu.mx',    'Cabo1234',    'TRP', 0],
    ['cabo.silva',      'TRP004', 'Carmen',   'Silva',   'cabo.silva@henm.edu.mx',      'Cabo1234',    'TRP', 0],
    ['teniente.vargas', 'OFC001', 'Roberto',  'Vargas',  'teniente.vargas@henm.edu.mx', 'Teniente123', 'OFC', 0],
    ['coronel.herrera', 'OFC002', 'Fernando', 'Herrera', 'coronel.herrera@henm.edu.mx', 'Coronel123',  'OFC', 1],
);

for my $p (@patrones) {
    my ($userid, $card, $first, $sur, $email, $pass, $cat, $super) = @$p;
    my $existente = Koha::Patrons->find({ userid => $userid });
    if ($existente) {
        $existente->set_password({ password => $pass, skip_validation => 1 });
        print "$userid: ya existía, password actualizado\n";
        next;
    }
    my $patron = Koha::Patron->new({
        userid       => $userid,
        cardnumber   => $card,
        firstname    => $first,
        surname      => $sur,
        email        => $email,
        branchcode   => 'MAIN',
        categorycode => $cat,
        flags        => $super ? 1 : 0,
        dateenrolled => '2026-07-15',
        dateexpiry   => '2036-07-15',
    })->store;
    $patron->set_password({ password => $pass, skip_validation => 1 });
    print "$userid: creado ($cat" . ($super ? ', superlibrarian' : '') . ")\n";
}
print "Listo.\n";
