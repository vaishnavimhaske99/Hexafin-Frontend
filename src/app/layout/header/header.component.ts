import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  
  userName: string = 'Vaishnavi Mhaske';
  userRole: string = 'TEAM LEAD';
  initials: string = 'VM';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // LocalStorage मधून डेटा घेण्यासाठी
    const name = localStorage.getItem('userName') || 'User';
    const role = localStorage.getItem('role') || 'User';
    
    this.userName = name;
    this.userRole = role;
    
    // Initials काढण्यासाठी (उदा. "Vaishnavi Mhaske" -> "VM")
    this.initials = name.split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}