#!/usr/bin/perl
# Aplica el diseño institucional HENM a Koha: carga los CSS/JS
# personalizados en las preferencias del sistema correspondientes.
use Modern::Perl;
use C4::Context;

my %mapa = (
    'OPACUserCSS'     => '/tmp/custom/koha-opac-custom.css',
    'OPACUserJS'      => '/tmp/custom/koha-opac-custom.js',
    'IntranetUserCSS' => '/tmp/custom/koha-staff-custom.css',
    'IntranetUserJS'  => '/tmp/custom/koha-staff-custom.js',
);

my $dbh = C4::Context->dbh;

for my $pref (sort keys %mapa) {
    my $file = $mapa{$pref};
    open my $fh, '<:encoding(UTF-8)', $file or do { warn "No se pudo abrir $file: $!"; next };
    my $contenido = do { local $/; <$fh> };
    close $fh;

    my $filas = $dbh->do(
        'UPDATE systempreferences SET value = ? WHERE variable = ?',
        undef, $contenido, $pref
    );
    if ($filas == 0 || $filas eq '0E0') {
        $dbh->do(
            'INSERT INTO systempreferences (variable, value, explanation, type) VALUES (?, ?, ?, ?)',
            undef, $pref, $contenido, 'Diseño institucional HENM', 'Textarea'
        );
        print "$pref: insertado (" . length($contenido) . " bytes)\n";
    } else {
        print "$pref: actualizado (" . length($contenido) . " bytes)\n";
    }
}

# Forzar español como único idioma (evita el fallback a inglés cuando el
# navegador pide es-MX y no encuentra coincidencia exacta)
$dbh->do("UPDATE systempreferences SET value = 'es-ES' WHERE variable IN ('OPACLanguages','StaffInterfaceLanguages','language')");
print "Idioma: es-ES fijado en OPAC y Staff\n";
print "Listo.\n";
