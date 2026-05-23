package ro.exitusro.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ExitusRoApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExitusRoApplication.class, args);
    }
}
