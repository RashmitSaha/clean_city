// nlohmann/json — single header placeholder for offline build verification.
// In production: download from https://github.com/nlohmann/json/releases
// and replace this file with the real json.hpp (v3.11+).
#pragma once
#include <string>
#include <map>
#include <vector>
#include <stdexcept>
#include <sstream>
#include <variant>
#include <initializer_list>

namespace nlohmann {

class json {
public:
    using object_t = std::map<std::string, json>;
    using array_t  = std::vector<json>;

    json() : type_(T_NULL) {}
    json(std::nullptr_t) : type_(T_NULL) {}
    json(bool v)        : type_(T_BOOL),   bool_val_(v)   {}
    json(int v)         : type_(T_INT),    int_val_(v)    {}
    json(double v)      : type_(T_DOUBLE), dbl_val_(v)    {}
    json(const std::string& v) : type_(T_STR), str_val_(v) {}
    json(const char* v)        : type_(T_STR), str_val_(v) {}

    // initializer_list constructor for { {"key", val}, ... } syntax
    json(std::initializer_list<std::pair<const std::string, json>> il)
        : type_(T_OBJ) {
        for (auto& p : il) obj_val_[p.first] = p.second;
    }

    // array from vector<int> / vector<double>
    template<typename T>
    json(const std::vector<T>& v) : type_(T_ARR) {
        for (auto& e : v) arr_val_.push_back(json(e));
    }

    static json parse(const std::string& s) {
        // Minimal parser — handles the subset used by the engine tests
        std::string t = trim(s);
        if (t == "null")  return json();
        if (t == "true")  return json(true);
        if (t == "false") return json(false);
        if (!t.empty() && t[0] == '{') return parse_object(t);
        if (!t.empty() && t[0] == '[') return parse_array(t);
        if (!t.empty() && t[0] == '"') return json(t.substr(1, t.size()-2));
        // number
        try {
            std::size_t pos;
            double d = std::stod(t, &pos);
            return json(d);
        } catch (...) {}
        throw std::runtime_error("json::parse: cannot parse: " + t);
    }

    json& operator[](const std::string& k) {
        type_ = T_OBJ;
        return obj_val_[k];
    }
    const json& operator[](const std::string& k) const {
        auto it = obj_val_.find(k);
        if (it == obj_val_.end()) throw std::out_of_range(k);
        return it->second;
    }
    json& at(const std::string& k) {
        auto it = obj_val_.find(k);
        if (it == obj_val_.end()) throw std::out_of_range(k);
        return it->second;
    }

    template<typename T>
    T value(const std::string& k, T def) const {
        auto it = obj_val_.find(k);
        if (it == obj_val_.end()) return def;
        return it->second.get<T>();
    }

    template<typename T> T get() const;

    bool empty() const {
        if (type_ == T_OBJ) return obj_val_.empty();
        if (type_ == T_ARR) return arr_val_.empty();
        return type_ == T_NULL;
    }

    // Range-for over array / object values
    auto begin() { return arr_val_.begin(); }
    auto end()   { return arr_val_.end();   }
    auto begin() const { return arr_val_.begin(); }
    auto end()   const { return arr_val_.end();   }

    std::string dump(int = -1) const {
        std::ostringstream os;
        dump_to(os);
        return os.str();
    }

private:
    enum Type { T_NULL, T_BOOL, T_INT, T_DOUBLE, T_STR, T_OBJ, T_ARR } type_;
    bool        bool_val_ = false;
    int         int_val_  = 0;
    double      dbl_val_  = 0.0;
    std::string str_val_;
    object_t    obj_val_;
    array_t     arr_val_;

    void dump_to(std::ostringstream& os) const {
        switch (type_) {
            case T_NULL:   os << "null"; break;
            case T_BOOL:   os << (bool_val_ ? "true" : "false"); break;
            case T_INT:    os << int_val_; break;
            case T_DOUBLE: os << dbl_val_; break;
            case T_STR:    os << '"' << str_val_ << '"'; break;
            case T_OBJ: {
                os << '{';
                bool first = true;
                for (auto& [k,v] : obj_val_) {
                    if (!first) os << ',';
                    os << '"' << k << '"' << ':';
                    v.dump_to(os);
                    first = false;
                }
                os << '}';
                break;
            }
            case T_ARR: {
                os << '[';
                for (std::size_t i = 0; i < arr_val_.size(); ++i) {
                    if (i) os << ',';
                    arr_val_[i].dump_to(os);
                }
                os << ']';
                break;
            }
        }
    }

    static std::string trim(const std::string& s) {
        auto b = s.find_first_not_of(" \t\r\n");
        auto e = s.find_last_not_of(" \t\r\n");
        return (b == std::string::npos) ? "" : s.substr(b, e - b + 1);
    }

    static json parse_object(const std::string& s) {
        json obj; obj.type_ = T_OBJ;
        // Very naive: find "key": value pairs at depth 1
        std::size_t i = 1;
        while (i < s.size() && s[i] != '}') {
            // skip whitespace
            while (i < s.size() && std::isspace(s[i])) ++i;
            if (s[i] == '}') break;
            if (s[i] == ',') { ++i; continue; }
            // key
            auto key_end = s.find('"', i + 1);
            std::string key = s.substr(i + 1, key_end - i - 1);
            i = key_end + 1;
            while (i < s.size() && s[i] != ':') ++i;
            ++i;
            while (i < s.size() && std::isspace(s[i])) ++i;
            // value — extract balanced substring
            std::string val_str = extract_value(s, i);
            obj.obj_val_[key] = parse(val_str);
            i += val_str.size();
        }
        return obj;
    }

    static json parse_array(const std::string& s) {
        json arr; arr.type_ = T_ARR;
        std::size_t i = 1;
        while (i < s.size() && s[i] != ']') {
            while (i < s.size() && std::isspace(s[i])) ++i;
            if (s[i] == ']' || s[i] == ',') { if (s[i] == ',') ++i; continue; }
            std::string val_str = extract_value(s, i);
            arr.arr_val_.push_back(parse(val_str));
            i += val_str.size();
        }
        return arr;
    }

    static std::string extract_value(const std::string& s, std::size_t start) {
        std::size_t i = start;
        if (s[i] == '"') {
            auto end = s.find('"', i + 1);
            return s.substr(i, end - i + 1);
        }
        if (s[i] == '{' || s[i] == '[') {
            char open = s[i], close = (open == '{') ? '}' : ']';
            int depth = 0;
            std::size_t j = i;
            for (; j < s.size(); ++j) {
                if (s[j] == open)  ++depth;
                if (s[j] == close) { --depth; if (!depth) break; }
            }
            return s.substr(i, j - i + 1);
        }
        // number / bool / null: read until delimiter
        std::size_t j = i;
        while (j < s.size() && s[j] != ',' && s[j] != '}' && s[j] != ']') ++j;
        return s.substr(i, j - i);
    }
};

// Specialisations of get<T>
template<> inline std::string json::get<std::string>() const {
    if (type_ == T_STR) return str_val_;
    if (type_ == T_INT) return std::to_string(int_val_);
    if (type_ == T_DOUBLE) return std::to_string(dbl_val_);
    return "";
}
template<> inline int    json::get<int>()    const { return (type_==T_DOUBLE)?(int)dbl_val_:int_val_; }
template<> inline double json::get<double>() const { return (type_==T_INT)?(double)int_val_:dbl_val_; }
template<> inline bool   json::get<bool>()   const { return bool_val_; }

} // namespace nlohmann
