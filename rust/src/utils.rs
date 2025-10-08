/// santize an int/float to remove all other possible `.` except the last one
fn keep_only_last_dot(s: &str) -> String {
    let mut parts: Vec<&str> = s.split('.').collect();
    if parts.len() <= 2 {
        return s.to_string(); // 0 or 1 dot: return original
    }

    // Join all except the last part without dots
    let last = parts.pop().unwrap(); // last segment after final dot
    let joined = parts.join(""); // remove dots and join others
    format!("{}.{}", joined, last)
}

/// function to change a string into a u64
pub fn to_int(value: &str) -> i64 {
    let num_val: i64 = keep_only_last_dot(value)
        .replace(".", ",")
        .replace(",", "")
        .replace("%", "")
        .replace("/", "")
        .parse()
        .expect(&format!("Failed to convert '{}' to int!", value));
    num_val
}

/// function to change a string into a f64
pub fn to_float(value: &str) -> f64 {
    let is_negative = value.contains("(");

    match is_negative {
        true => {
            let num_val_temp = keep_only_last_dot(value)
                .replace("(", "-")
                .replace(")", "")
                .replace(",", "")
                .replace("%", "")
                .replace("/", "");
            let num_val: f64 = num_val_temp
                .parse()
                .expect(&format!("Failed to convert '{}' to float!", value));
            num_val
        }
        _ => {
            let num_val_temp = keep_only_last_dot(value)
                .replace(",", "")
                .replace("%", "")
                .replace("/", "");
            let num_val: f64 = num_val_temp
                .parse()
                .expect(&format!("Failed to convert '{}' to float!", value));
            num_val
        }
    }
}

/// used to figure out the broker REF, csd ref, and luse_id; based on final trade settlement report for the 7th of Oct 2025
pub fn find_first_two_letters(s: &str) -> Option<(usize, usize)> {
    let mut indices = s
        .char_indices() // gives (byte_index, char)
        .filter(|(_, c)| c.is_ascii_alphabetic()) // keep only English letters
        .map(|(i, _)| i); // keep the byte index

    if let (Some(first), Some(second)) = (indices.next(), indices.next()) {
        Some((first, second))
    } else {
        None
    }
}
