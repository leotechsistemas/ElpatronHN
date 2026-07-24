package com.patron.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "company_settings")
public class CompanySettings {

    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(length = 300)
    private String slogan;

    @Column(columnDefinition = "TEXT")
    private String logo;

    @Column(length = 10)
    private String currency;

    @Column(name = "currency_symbol", length = 10)
    private String currencySymbol;

    private Integer isv = 15;

    @Column(length = 50)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 150)
    private String email;

    @Column(length = 300)
    private String facebook;

    @Column(length = 300)
    private String instagram;

    @Column(length = 300)
    private String tiktok;

    @Column(length = 300)
    private String whatsapp;

    @Column(length = 300)
    private String youtube;

    @Column(length = 300)
    private String linkedin;

    public CompanySettings() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getSlogan() { return slogan; }
    public void setSlogan(String slogan) { this.slogan = slogan; }
    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }
    public Integer getIsv() { return isv; }
    public void setIsv(Integer isv) { this.isv = isv; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFacebook() { return facebook; }
    public void setFacebook(String facebook) { this.facebook = facebook; }
    public String getInstagram() { return instagram; }
    public void setInstagram(String instagram) { this.instagram = instagram; }
    public String getTiktok() { return tiktok; }
    public void setTiktok(String tiktok) { this.tiktok = tiktok; }
    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
    public String getYoutube() { return youtube; }
    public void setYoutube(String youtube) { this.youtube = youtube; }
    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }
}
