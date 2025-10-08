use super::utils::{find_first_two_letters, to_float, to_int};
use napi_derive::napi;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct SettledTrade {
    pub csd_ref: String,
    pub broker_ref: String,
    pub luse_id: i64,
    pub symbol: String,
    pub price: f64,
    pub qty: i64,
    pub value: f64,
    pub counter_firm: String,
    /// `buy` or `sell`
    pub side: String,
    pub date: i64,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Setting {
    BUYS,
    SELLS,
}

impl SettledTrade {
    pub fn new(row: &str, date: i64, setting: Setting) -> Self {
        // println!("\n### shareholder raw\n{:#?}\n###\n\n", row);

        let mut side = String::from("buy");

        if setting == Setting::SELLS {
            side = String::from("sell");
        }

        let p_vec: Vec<&str> = row.split("-LI").collect();
        let p1 = p_vec[0];
        let mut p2 = p_vec[1].to_string();
        p2 = p2.replace("\u{a0}", "");

        let symbol = p2[..4].to_string();

        p2 = p2.replace(&symbol, "");

        // println!("\nxxx p2 post counter = {}\n", &p2);

        let p2_vec: Vec<&str> = p2.split(".").collect();

        let qty: i64 = to_int(p2_vec[0]);
        // get last 4 chars
        let counter_firm = p2_vec[2]
            .chars()
            .rev()
            .take(4)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();

        let val_dec = p2_vec[2].replace(&counter_firm, "");
        let val_int: String = p2_vec[1].chars().skip(2).collect();

        let value: f64 = to_float(&format!("{}.{}", val_int, val_dec));

        let price = value / qty as f64;

        /*
        println!(
            "\n]]]\nsymbol = {}\nvalue = {}\nqty = {}\nprice = {}\n]]]\n\n",
            symbol, value, qty, price
        );
        */

        let mut csd_ref = "".to_string();
        let mut broker_ref = "".to_string();
        let mut luse_id: i64 = 0;

        if let Some((first, second)) = find_first_two_letters(&p1) {
            let start_i = first - 2;
            let end_i = second + 1;

            broker_ref = p1[start_i..end_i].to_string();

            let p1_vec: Vec<&str> = p1.split(&broker_ref).collect();

            csd_ref = p1_vec[0].to_string();

            luse_id = to_int(p1_vec[1])

            // println!("\n--- broker ref\n{:#?}\n---\n\n", broker_ref);
        }

        SettledTrade {
            csd_ref,
            broker_ref,
            luse_id,
            symbol,
            price,
            qty,
            value,
            counter_firm,
            side,
            date,
        }
    }
}

#[napi(object)]
pub struct SettledInfo {
    pub data: Vec<SettledTrade>,
    pub total_buy: f64,
    pub total_buy_clients: i64,
    pub total_sell: f64,
    pub total_sell_clients: i64,
    pub net_val: f64,
    pub date: i64,
}
