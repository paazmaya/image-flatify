//! Media file extension checking module.

use std::path::Path;

pub const EXTENSIONS: &[&str] = &[
    "ase", "art", "bmp", "blp", "cd5", "cit", "cpt", "cr2", "cut", "dds", "dib", "djvu", "egt",
    "exif", "gif", "gpl", "grf", "icns", "ico", "iff", "jng", "jpeg", "jpg", "jfif", "jp2", "jps",
    "lbm", "max", "miff", "mng", "msp", "nitf", "ota", "pbm", "pc1", "pc2", "pc3", "pcf", "pcx",
    "pdn", "pgm", "pi1", "pi2", "pi3", "pict", "pct", "pnm", "pns", "ppm", "psb", "psd", "pdd",
    "psp", "px", "pxm", "pxr", "qfx", "raw", "rle", "sct", "sgi", "rgb", "int", "bw", "tga",
    "tiff", "tif", "vtf", "xbm", "xcf", "xpm", "3dv", "amf", "ai", "awg", "cgm", "cdr", "cmx",
    "dxf", "e2d", "eps", "fs", "gbr", "odg", "svg", "stl", "vrml", "x3d", "sxd", "v2d", "vnd",
    "wmf", "emf", "xar", "png", "webp", "jxr", "hdp", "wdp", "cur", "ecw", "liff", "nrrd", "pam",
    "pgf", "rgba", "inta", "sid", "ras", "sun", "mp4", "avi", "mpg", "mpeg", "mts", "mov", "mkv",
    "3gp", "heic", "heif",
];

/// Check if the given file path has a suffix matching available media file suffixes.
#[must_use]
pub fn is_media(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let lower = ext.to_ascii_lowercase();
            EXTENSIONS.contains(&lower.as_str())
        })
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_media() {
        assert!(!is_media(Path::new("hoplaa.js")));
        assert!(is_media(Path::new("hoplaa.jpg")));
        assert!(is_media(Path::new("hoplaa.jpeg")));
        assert!(is_media(Path::new("hoplaa.mp4")));
        assert!(is_media(Path::new("hoplaa.test.GIF")));
        assert!(is_media(Path::new("photo.HEIC")));
        assert!(!is_media(Path::new("no_ext")));
    }
}
