"use client"
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import Image from "next/image";
import React, { Component } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getImagePrefix } from "@/utils/util";

// CAROUSEL SETTINGS
const Companies = () => {
    const [marks, setMarks] = useState([]);

    useEffect(() => {
        apiGet("/marks/")
            .then(setMarks)
            .catch(console.error);
    }, []);

    const settings = {
        dots: false,
        infinite: true,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: false,
        autoplay: true,
        speed: 2000,
        autoplaySpeed: 2000,
        cssEase: "linear",
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: false
                }
            },
            {
                breakpoint: 700,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: false
                }
            },
            {
                breakpoint: 500,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: false
                }
            }
        ]
    };

    return (
        <section className='text-center' >
            <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
                <h2 className="text-midnight_text text-2xl font-semibold">Our's Shining Stars</h2>
                <div className="py-14 border-b ">
                    <Slider {...settings}>
                        {marks.map((item, i) =>

                            <div key={i}>
                                <Image
                                    src={
                                        !item.image
                                            ? "/images/student_placeholder.png"
                                            : item.image.startsWith("http")
                                                ? item.image
                                                : `${getImagePrefix()}${item.image}`
                                    }
                                    alt=""
                                    width={196}
                                    height={76}
                                />
                            </div>
                        )}
                    </Slider>
                </div>
            </div>
        </section>
    )

}

export default Companies;